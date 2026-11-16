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

Medição de **16/11/2026** (430 testes, 0 falhas):

| Pacote | Linhas cobertas | Cobertura |
|---|---|---|
| controller | 82 / 87 | 94,3% |
| service | 882 / 919 | 96,0% |
| security | 112 / 124 | 90,3% |
| exception | 91 / 100 | 91,0% |
| job | 31 / 35 | 88,6% |
| dto | 40 / 41 | 97,6% |
| repository | 21 / 21 | 100% |
| model e model.enums | 25 / 25 | 100% |
| **Total** | **1284 / 1352** | **95,0%** |

Evolução:

| Momento | Cobertura total |
|---|---|
| Primeira medição, ao configurar o JaCoCo (#360) | 87,9% |
| Após os testes do fluxo de alertas por e-mail e do histórico de movimentações (#361) | 95,0% |

Na #361, o fluxo de alertas de estoque baixo e de validade (`AlertaEstoqueBaixoJob`, `AlertaValidadeJob` e `NotificacaoEmailServiceImpl`), que não tinha teste nenhum, passou a ter 100% de cobertura de linhas.
