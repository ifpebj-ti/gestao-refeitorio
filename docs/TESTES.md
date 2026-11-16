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

Medição de **16/11/2026**, após a #290 (448 testes, 0 falhas):

| Pacote | Linhas cobertas | Cobertura |
|---|---|---|
| controller | 87 / 92 | 94,6% |
| service | 926 / 965 | 96,0% |
| security | 112 / 124 | 90,3% |
| exception | 93 / 102 | 91,2% |
| job | 31 / 35 | 88,6% |
| dto | 41 / 42 | 97,6% |
| repository | 21 / 21 | 100% |
| model e model.enums | 25 / 25 | 100% |
| **Total** | **1336 / 1406** | **95,0%** |

Evolução:

| Momento | Cobertura total |
|---|---|
| Primeira medição, ao configurar o JaCoCo (#360) | 87,9% |
| Após os testes do fluxo de alertas por e-mail e do histórico de movimentações (#361) | 95,0% |
| Após o anexo de documento da nota (#290), com os testes do código novo | 95,0% |

Na #361, o fluxo de alertas de estoque baixo e de validade (`AlertaEstoqueBaixoJob`, `AlertaValidadeJob` e `NotificacaoEmailServiceImpl`), que não tinha teste nenhum, passou a ter 100% de cobertura de linhas.

Na #290, o anexo de documento da nota (`NotaDocumentoServiceImpl` e a detecção de PDF em `AssinaturaDocumento`) entrou já coberto por testes unitários e de integração, mantendo a cobertura total.
