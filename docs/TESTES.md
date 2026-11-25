# Testes automatizados e cobertura do backend

## Tipos de teste

- **Unitários** (JUnit 5 + Mockito): isolam os services, jobs e DTOs, com os repositórios mockados. Não sobem o contexto Spring.
- **Integração** (`@SpringBootTest` + MockMvc + Testcontainers): sobem a aplicação inteira contra um PostgreSQL 16 real em container, com as migrations do Flyway. Cobrem os endpoints, a autorização por perfil (401/403), CSRF, CORS e o login. Não usamos H2, porque as migrations dependem de recursos do PostgreSQL.

Os dois tipos rodam juntos no `mvn verify`. Para rodar localmente, o Docker precisa estar aberto (ver [GUIA_EXECUCAO.md](../GUIA_EXECUCAO.md), seção 6).

## Relatório de cobertura (JaCoCo)

```bash
cd backend
mvn verify
```

- O relatório fica em `backend/target/site/jacoco/index.html` (também há `jacoco.xml` e `jacoco.csv`).
- Na CI, cada execução do job de backend publica o relatório como o artefato **`backend-coverage-report`**, disponível por 14 dias na página da execução no GitHub Actions.

## Gate de cobertura

O `jacoco:check` roda na fase `verify` e exige **pelo menos 70% de cobertura de linhas** no backend inteiro. Abaixo disso, o build falha, localmente e na CI. Como a CI roda `mvn clean verify` em todo pull request, nenhum PR que derrube a cobertura abaixo da meta passa.

## O que fica fora da medição

| Item | Por quê |
|---|---|
| `GestaoRefeitorioApplication` | Só contém o `main` que sobe o contexto Spring; não há regra de negócio. |
| Métodos gerados pelo Lombok (getters, setters, construtores) | O `backend/lombok.config` marca esse código com `@Generated`, que o JaCoCo ignora, conforme recomenda a documentação do JaCoCo. |

DTOs, entidades, exceptions e controllers **continuam medidos**.

## Cobertura atual

Medição de **25/11/2026**, após a #468 (539 testes, 0 falhas):

| Pacote | Linhas cobertas | Cobertura |
|---|---|---|
| controller | 79 / 83 | 95,2% |
| service | 1012 / 1051 | 96,3% |
| security | 151 / 163 | 92,6% |
| exception | 97 / 106 | 91,5% |
| job | 31 / 35 | 88,6% |
| dto | 45 / 46 | 97,8% |
| repository | 56 / 56 | 100% |
| model e model.enums | 28 / 28 | 100% |
| **Total** | **1499 / 1568** | **95,6%** |

Evolução:

| Momento | Cobertura total |
|---|---|
| Primeira medição, ao configurar o JaCoCo (#360) | 87,9% |
| Após os testes do fluxo de alertas por e-mail e do histórico de movimentações (#361) | 95,0% |
| Após o anexo de documento da nota (#290), com os testes do código novo | 95,0% |
| Após a validação e o cancelamento de nota (#291), incluindo o teste de concorrência | 95,1% |
| Após a consulta de notas por status, remetente e período (#292) | 95,2% |
| Após a emissão de nota local com numeração sequencial (#293), incluindo o teste de emissões simultâneas | 95,4% |
| Após a restauração dos locais de armazenamento e o endpoint de listagem (#473), com o teste da migration V29 | 95,4% |
| Após a sessão por cookie com o cabeçalho `X-XSRF-TOKEN` (#488), com os testes do fluxo real, sem o `csrf()` do Spring Security Test | 95,4% |
| Após o bloqueio do auto-rebaixamento de ADMIN e a reativação de usuário (#471) | 95,4% |
| Após a trava de saldo nas saídas simultâneas (#475), com o teste de concorrência | 95,4% |
| Após a restrição do histórico e das fotos por perfil e posse (#474) | 95,6% |
| Após a padronização das respostas 401 e 403 em JSON UTF-8 (#491) | 95,6% |
| Após a normalização e a unicidade case-insensitive dos e-mails (#468), com o teste da migration V30 | 95,6% |

Na #361, o fluxo de alertas de estoque baixo e de validade (`AlertaEstoqueBaixoJob`, `AlertaValidadeJob` e `NotificacaoEmailServiceImpl`), que não tinha teste nenhum, passou a ter 100% de cobertura de linhas.

Na #290, o anexo de documento da nota (`NotaDocumentoServiceImpl` e a detecção de PDF em `AssinaturaDocumento`) entrou já coberto por testes unitários e de integração, mantendo a cobertura total.
