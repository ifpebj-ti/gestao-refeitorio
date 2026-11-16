# ADR 0002: Persistência em PostgreSQL com Flyway e Armazenamento Seguro de Fotos no Banco (`BYTEA`)

- **Status:** Aceito
- **Issues Relacionadas:** `#54`, `#84`, `#88`, `#230`, `#231`, `#286`, `#287`, `#322`

## Contexto

O controle de estoque do refeitório exige integridade transacional estrita para cálculo de saldos por local de armazenamento, rastreabilidade histórica de entradas/saídas, vínculo com notas de recebimento e anexação opcional de comprovantes fotográficos (fotos de notas ou mercadorias). Além disso, a evolução contínua do esquema de banco entre ambientes de desenvolvimento, testes automatizados e produção precisava ser determinística e auditável, sem depender de serviços externos de armazenamento de arquivos (como S3/MinIO) que aumentariam o consumo de memória na VM de produção.

## Decisão

1. **PostgreSQL 16 + Flyway (`ddl-auto: validate`):**
   - Toda alteração estrutural ou carga inicial de catálogo é versionada em scripts SQL imutáveis em `backend/src/main/resources/db/migration` (`V1` a `V25`).
   - O Hibernate opera exclusivamente em modo `validate`, garantindo que a aplicação falhe imediatamente na subida caso o esquema físico divirja das entidades JPA.
   - Os testes de integração do backend utilizam **Testcontainers** com uma instância real do PostgreSQL 16 para validar as migrations Flyway e as constraints relacionais.
2. **Armazenamento de Fotos em Tabela Separada (`movimentacao_fotos`) com Validação Binária:**
   - As fotos das movimentações são persistidas em coluna `BYTEA` na tabela dedicada `movimentacao_fotos` (relacionamento `1:0..1` com `movimentacoes`), evitando tráfego binário nas listagens comuns de estoque.
   - Antes de persistir, o backend limita o upload a `5 MB` e valida os **magic bytes** (assinatura binária real de `JPEG` e `PNG`), ignorando extensões ou cabeçalhos `Content-Type` falsificados pelo cliente, e nunca grava arquivos em caminhos do sistema de arquivos local.
   - O documento digitalizado da nota de recebimento (US28/#290) segue a mesma decisão: `BYTEA` na tabela `nota_documentos` (`1:0..1` com `notas`), limite de `5 MB` e conferência dos magic bytes, aceitando também `PDF` (`%PDF-`). Para o documento, o tipo detectado precisa ser igual ao declarado.
3. **Backup Lógico Diário:**
   - Um script automatizado (`scripts/backup-postgres.sh`) executa `pg_dump` compactado com validação de integridade do arquivo `.sql.gz` e retenção rotativa.

## Consequências

- **Positivas:**
  - Elimina vulnerabilidades de *Path Traversal* e *Unrestricted File Upload* no servidor de aplicação.
  - Um único backup transacional do PostgreSQL (`pg_dump`) preserva tanto os registros contábeis quanto as evidências fotográficas das movimentações.
  - Infraestrutura enxuta para execução dentro dos limites de recursos da VM na OCI.
- **Negativas / Trade-offs:**
  - O crescimento do volume de fotos aumenta o tamanho do banco de dados, exigindo o limite estrito de `5 MB` por imagem e no máximo uma foto por movimentação.
