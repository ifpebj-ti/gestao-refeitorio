# Sistema de Controle de Estoque da Cozinha — IFPE Campus Belo Jardim

Plataforma web (responsiva para mobile) para centralizar o controle de estoque,
produção interna, notas de recebimento, documentos e relatórios da cozinha do
campus.

## Arquitetura

**Frontend:** Next.js (React + TypeScript) + Tailwind CSS
**Backend:** Spring Boot 3 (Java 21), organizado por camada (padrão clássico Spring MVC):
- `model` — entidades JPA (`model/enums` para os enums)
- `repository` — interfaces JPA
- `service` — regras de negócio
- `controller` — endpoints REST
- `dto` — objetos de transferência de dados
- `security` — configuração de segurança, JWT, filtro de autenticação
- `job` — jobs agendados (ex: alerta de validade)
- `exception` — tratamento global de exceções

**Banco de dados:** PostgreSQL, com migrações versionadas via Flyway
**Autenticação/Autorização:** JWT + Spring Security, com dois perfis (`NUTRICIONISTA` e `COZINHEIRA`) controlados via `@PreAuthorize`
**Arquivos (fotos/documentos):** armazenar fora do banco (MinIO/S3) e salvar apenas a URL — ainda não implementado neste esqueleto, ver "Próximos passos"
**Alertas de validade:** job agendado (`AlertaValidadeJob`, Spring `@Scheduled`) que roda diariamente

```
estoque-cozinha-ifpe/
├── backend/
│   └── src/main/java/br/ifpe/estoquecozinha/
│       ├── model/          # entidades + model/enums
│       ├── repository/
│       ├── service/
│       ├── controller/
│       ├── dto/
│       ├── security/
│       ├── job/
│       └── exception/
├── frontend/   # Next.js
└── docker-compose.yml
```

## Pré-requisitos

- Java 21+ e Maven (ou use o wrapper, se adicionar `mvnw` depois)
- Node.js 20+
- Docker e Docker Compose (opcional, mas recomendado para rodar tudo junto)
- PostgreSQL 16 (se não usar Docker)

## Primeiros passos

### 1. Clonar e configurar

```bash
git clone <url-do-repo>
cd estoque-cozinha-ifpe
```

### 2. Rodar tudo com Docker Compose (mais simples)

```bash
docker compose up --build
```

- Backend disponível em `http://localhost:8080`
- Swagger/OpenAPI em `http://localhost:8080/swagger-ui.html`
- Frontend disponível em `http://localhost:3000`
- Health check em `http://localhost:8080/actuator/health`

### 3. Rodar em modo desenvolvimento (sem Docker)

**Banco de dados:**
```bash
docker run -d --name estoque-db -e POSTGRES_DB=estoque_cozinha \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine
```

**Backend:**
```bash
cd backend
mvn spring-boot:run
```
A migração inicial (`db/migration/V1__init.sql`) roda automaticamente via Flyway na primeira subida.

**Frontend:**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Variáveis de ambiente principais (backend)

| Variável | Descrição | Padrão (dev) |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexão com PostgreSQL | `localhost:5432/estoque_cozinha` |
| `JWT_SECRET` | Segredo usado para assinar os tokens JWT | **trocar em produção** |

## Próximos passos

Este é o esqueleto inicial — cobre estrutura, uma entidade completa (`Produto`)
de ponta a ponta (entidade → repositório → service → controller) e a base de
segurança/JWT. Ainda faltam, por prioridade:

1. Endpoint de autenticação (`/api/auth/login`) — gerar o JWT a partir de email/senha
2. CRUD completo de `Movimentacao` (entrada/saída), com a regra de saldo não-negativo
3. Fluxo de `Nota` (validar/recusar com justificativa) — telas 3 e 4 do protótipo
4. Upload de fotos/documentos (integração com storage — MinIO em dev)
5. Endpoint de relatórios (dados para os gráficos da tela 6)
6. Cadastro de produção interna e de cardápios
7. Testes de integração (seguindo o padrão que já foi usado no GuiaOrlaPE)
8. Notificação real do job de alerta de validade (hoje só loga)

## Pontos a validar com o cliente

Ver seção 8 do Documento de Visão — várias regras (locais de armazenamento,
controle de lote, orçamento mensal, formato do relatório exportado, etc.)
ainda precisam ser fechadas antes de detalhar essas funcionalidades.
