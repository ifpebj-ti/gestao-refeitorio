# Gestão de Refeitório — IFPE Campus Belo Jardim

Plataforma web, responsiva para celular, de controle de estoque da cozinha do campus: produtos, entradas e saídas por local de armazenamento, produção interna, validade e alertas, cardápio com projeção de consumo, notas de recebimento e relatórios.

**Aplicação em produção:** https://gestao-refeitorio-ifpe.duckdns.org
O login em produção é feito com uma conta Google previamente cadastrada no sistema.

---

## Para os professores: testes de segurança sem Google

Para os testes de segurança existem dois usuários locais, que entram com e-mail e senha, sem Google OAuth:

| Perfil | E-mail |
|---|---|
| `NUTRICIONISTA` | `nutricionista@seguranca.local` |
| `COZINHA` | `cozinha@seguranca.local` |

- Esses usuários só existem quando o sistema roda **localmente** com o profile `seguranca`. A aplicação se recusa a subir se esse profile for ativado junto com o de produção (`prod`).
- As senhas **não ficam no repositório**. Quem executa o sistema define cada uma no `.env`, como mostra o passo 2.
- O perfil `ADMIN` não tem usuário local: ele só entra via Google, com o e-mail definido em `ADMIN_INICIAL_EMAIL`.

### Passo a passo

Pré-requisitos: Git e Docker com Docker Compose.

**1. Clonar o repositório**

```bash
git clone https://github.com/ifpebj-ti/gestao-refeitorio.git
cd gestao-refeitorio
```

**2. Criar o `.env` e definir as senhas**

Copie o `.env.example` para `.env` (`cp .env.example .env` no bash, `Copy-Item .env.example .env` no PowerShell) e ajuste estas linhas:

```dotenv
JWT_SECRET=qualquer-texto-com-pelo-menos-32-caracteres
SPRING_PROFILES_ACTIVE=seguranca
LOCAL_NUTRI_SENHA=defina-uma-senha-com-12-ou-mais-caracteres
LOCAL_COZINHA_SENHA=defina-outra-senha-com-12-ou-mais
```

- `JWT_SECRET` precisa ter **pelo menos 32 caracteres**.
- Cada senha precisa ter **pelo menos 12 caracteres**.
- Se algum desses valores faltar, a aplicação não sobe e mostra no log uma mensagem dizendo o que corrigir.

**3. Subir o sistema**

```bash
docker compose up -d --build
docker compose logs -f backend
```

Espere aparecer `Started GestaoRefeitorioApplication` e depois saia do log com Ctrl+C. O sistema continua rodando.

**4. Obter o token**

bash:

```bash
curl -s -X POST http://localhost:8080/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"email":"nutricionista@seguranca.local","senha":"SENHA_DEFINIDA_NO_ENV"}'
```

PowerShell:

```powershell
$resposta = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/local `
  -ContentType "application/json" `
  -Body '{"email":"nutricionista@seguranca.local","senha":"SENHA_DEFINIDA_NO_ENV"}'
$resposta.token
```

- A resposta traz o campo `token`, um JWT da aplicação.
- Para o perfil COZINHA, repita o pedido com `cozinha@seguranca.local` e a senha dele.
- E-mail ou senha errados devolvem **401**, sempre com a mesma mensagem genérica.

**5. Usar o token no Swagger**

Abra http://localhost:8080/swagger-ui.html, clique em **Authorize**, cole o token e confirme. A partir daí, as chamadas feitas pelo Swagger vão autenticadas com esse perfil.

O token também funciona fora do Swagger, no cabeçalho `Authorization: Bearer <token>`:

```bash
curl -i http://localhost:8080/api/remetentes -H "Authorization: Bearer $TOKEN"
```

### Resultados esperados

| Teste | NUTRICIONISTA | COZINHA | Sem token |
|---|---|---|---|
| `GET /api/produtos` | 200 | 200 | 401 |
| `GET /api/remetentes` | 200 | **403** | 401 |
| `GET /api/usuarios` | **403** | **403** | 401 |

- **401:** a requisição não tem token válido (ausente, inválido ou expirado).
- **403:** o token é válido, mas o perfil não tem permissão para o endpoint.

Em endpoints que recebem um corpo (`POST`/`PUT`/`PATCH`), a validação dos dados acontece antes da checagem de perfil. Por isso, um corpo inválido devolve 400 mesmo para quem não tem permissão. Para ver o 403 nesses endpoints, envie um corpo válido.

### Permissões por endpoint

A autorização é validada sempre no backend, com `@PreAuthorize` em cada endpoint. Esconder telas no frontend é só conveniência.

| Endpoint | Perfis permitidos |
|---|---|
| `POST /api/auth/google`, `POST /api/auth/logout` | público |
| `POST /api/auth/local` | público, **só com o profile `seguranca`** |
| `GET /api/auth/me` | qualquer perfil autenticado |
| `GET /api/produtos`, `GET /api/produtos/{id}`, `GET /api/produtos/{id}/saldo-por-local`, `GET /api/produtos/{id}/movimentacoes` | qualquer perfil autenticado |
| `POST /api/produtos`, `PATCH /api/produtos/{id}/unidade-medida`, `.../quantidade-minima`, `.../valor-referencia`, `.../controle-validade`, `DELETE /api/produtos/{id}` | `NUTRICIONISTA` |
| `POST /api/movimentacoes/entrada` | `NUTRICIONISTA` |
| `POST /api/movimentacoes/saida`, `POST /api/movimentacoes/{id}/foto` | `NUTRICIONISTA`, `COZINHA` |
| `GET /api/movimentacoes`, `GET /api/movimentacoes/{id}/foto` | qualquer perfil autenticado |
| `POST /api/producoes-internas` | `NUTRICIONISTA`, `COZINHA` |
| `POST /api/cardapios` | `NUTRICIONISTA` |
| `GET /api/cardapios`, `GET /api/cardapios/{id}`, `GET /api/cardapios/projecao-consumo` | qualquer perfil autenticado |
| `/api/notas/**` | `NUTRICIONISTA` |
| `/api/remetentes/**` | `NUTRICIONISTA` |
| `/api/relatorios/**` (mensal, PDF, Excel e consumo) | `NUTRICIONISTA` |
| `/api/usuarios/**` | `ADMIN` |

Para encerrar e apagar os dados de teste: `docker compose down -v`.

---

## Funcionalidades

- Cadastro de produtos com categoria, unidade de medida, valor de referência, quantidade mínima e controle de validade.
- Entradas, conferidas pela nutricionista, com origem (externa, agroindústria ou interna), lote, validade e foto opcional.
- Saídas por consumo, perda, descarte ou outro motivo.
- Saldo calculado por produto **e** por local de armazenamento, sem permitir saldo negativo.
- Produção interna, com setor de origem e responsável.
- Alertas de estoque baixo e de validade próxima, por job diário e, opcionalmente, por e-mail.
- Cardápio com projeção de consumo (quantidade por pessoa × pessoas estimadas) e tela para TV.
- Notas de recebimento vinculadas às entradas, com cadastro de remetentes.
- Relatório mensal consolidado, exportação em PDF e Excel e gráfico de consumo por período.
- Gestão de usuários pelo ADMIN, com convite por e-mail e controle do primeiro acesso.

## Perfis de acesso

| Perfil | Quem é | O que faz |
|---|---|---|
| `ADMIN` | Equipe técnica (TI) | Só gerencia usuários; não opera estoque nem catálogo. |
| `NUTRICIONISTA` | Nutricionista do campus | Gerencia o catálogo, confere entradas, cardápios, notas e relatórios. |
| `COZINHA` | Equipe da cozinha | Registra saídas, produção interna e fotos; consulta o estoque. |

Não existe auto-cadastro: um usuário só entra se o ADMIN já tiver cadastrado o e-mail dele. Um e-mail não cadastrado recebe 403.

## Arquitetura e stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 6, Tailwind CSS 4 |
| Backend | Java 21, Spring Boot 4.1, Spring Security, Spring Data JPA, Flyway |
| Banco de dados | PostgreSQL 16 (as fotos também ficam no banco, em tabela própria) |
| Autenticação | Google OAuth2/OIDC + JWT próprio da aplicação; RBAC com `@PreAuthorize` |
| Infraestrutura | Docker Compose, Nginx com TLS (Let's Encrypt), VM na OCI |
| CI/CD e segurança | GitHub Actions, Release Please, Semgrep, Trivy, CodeQL, Dependabot, Cosign |

O backend é organizado em camadas, sempre na ordem controller → service → repository:

```
backend/src/main/java/br/ifpe/gestaorefeitorio/
├── controller/   # recebe a requisição, valida o DTO, chama o service
├── service/      # regras de negócio (interface + implementação)
├── repository/   # acesso a dados (Spring Data JPA)
├── model/        # entidades JPA e enums de domínio
├── dto/          # DTOs de requisição (validados) e de resposta
├── security/     # Google OAuth2, JWT, filtros, RBAC
├── job/          # jobs agendados (alertas, inicializadores)
└── exception/    # exceções de domínio e handler global
```

O modelo de dados, com diagrama, dicionário e regras de integridade, está em [docs/MODELAGEM_DADOS.md](docs/MODELAGEM_DADOS.md).

## Como rodar localmente

```bash
cp .env.example .env      # defina ao menos JWT_SECRET (32+ caracteres)
docker compose up -d --build
```

| Serviço | Endereço |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |
| Health check | http://localhost:8080/actuator/health |
| Mailpit (e-mails de dev) | http://localhost:8025 |

O `docker-compose.override.yml`, aplicado automaticamente em dev, publica as portas e sobe o Mailpit, que captura os e-mails enviados. As migrations do Flyway rodam sozinhas na subida.

O guia completo está em [GUIA_EXECUCAO.md](GUIA_EXECUCAO.md). Ele cobre como rodar só o backend, como rodar os testes (Testcontainers) e a solução de problemas no Windows.

## Variáveis de ambiente

Os valores ficam no `.env`, que não é versionado. O modelo é o [.env.example](.env.example).

| Variável | Uso |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Banco PostgreSQL |
| `JWT_SECRET` | Assinatura dos tokens (obrigatório, 32+ caracteres) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login com Google |
| `APP_URL_FRONTEND` | Origens aceitas no CORS (separadas por vírgula) |
| `APP_URL_LOGIN` | Link da tela de login enviado no convite |
| `ADMIN_INICIAL_EMAIL`, `ADMIN_INICIAL_NOME` | Primeiro ADMIN, criado se não houver nenhum ativo |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP |
| `ALERTA_EMAIL_HABILITADO` | Envio dos alertas por e-mail (`false` = só registra no log) |
| `SPRING_PROFILES_ACTIVE`, `LOCAL_NUTRI_SENHA`, `LOCAL_COZINHA_SENHA` | Login local de testes (só local) |

## Segurança

- Login exclusivamente via Google em produção. O backend valida o `id_token` junto ao Google e emite o próprio JWT.
- Respostas diferentes para requisição não autenticada (401) e para perfil sem permissão (403). E-mail não cadastrado e usuário inativo recebem a mesma resposta genérica, para não revelar quais contas existem.
- Entrada validada por Bean Validation nos DTOs. Consultas sempre parametrizadas (JPA). Fotos aceitas só em JPEG ou PNG, com o tipo conferido pela assinatura do arquivo (e não pelo nome ou pelo `Content-Type` declarado), e guardadas no banco, nunca em caminho de disco escolhido pelo cliente.
- Proteção CSRF: requisições que alteram dados e se autenticam só pelo cookie de sessão precisam de token CSRF (senão, 403). Chamadas com `Authorization: Bearer`, como as do frontend, não são afetadas. Em produção, os cookies são `HttpOnly`, `SameSite=Lax` e `Secure`.
- Segredos só por variáveis de ambiente. Tokens, senhas e `id_token` nunca vão para os logs.
- Em produção, o Swagger fica desligado e as portas do backend e do frontend ficam restritas à própria VM, atrás do Nginx com TLS.
- A política de segurança e o canal de reporte de vulnerabilidades estão em [SECURITY.md](SECURITY.md). A modelagem de ameaças está na [Wiki](https://github.com/ifpebj-ti/gestao-refeitorio/wiki).

## CI/CD

Todo pull request para a `main` passa por lint, verificação de tipos, build, testes do backend (unitários e de integração com PostgreSQL real via Testcontainers), SAST com Semgrep, revisão de dependências e scan das imagens com Trivy.

Depois do merge, as imagens vão para o GHCR, e o Release Please calcula a versão (SemVer) a partir dos Conventional Commits. Cada release assina as imagens com Cosign, gera os SBOMs e faz o deploy em produção, com health check e rollback automático.

Os detalhes estão em [docs/CI_CD.md](docs/CI_CD.md). O histórico de versões está no [CHANGELOG.md](CHANGELOG.md).

## Documentação

- [Wiki do repositório](https://github.com/ifpebj-ti/gestao-refeitorio/wiki): Documento de Visão, Arquitetura e Modelagem de Ameaças.
- [Protótipo no Figma](https://www.figma.com/design/4ndEJajgHfDGwRlFqvI7so/Gest%C3%A3o-Refeit%C3%B3rio---Esbo%C3%A7o-Baixa-Fidelidade?node-id=0-1&t=lGlpIrKxmdAmCb68-1): esboço de baixa fidelidade das telas do sistema.
- [GUIA_EXECUCAO.md](GUIA_EXECUCAO.md): execução, configuração, testes e solução de problemas.
- [docs/CI_CD.md](docs/CI_CD.md): esteira, releases, deploy e rollback.
- [docs/MODELAGEM_DADOS.md](docs/MODELAGEM_DADOS.md): modelo de dados.
- [docs/BACKUP_POSTGRES.md](docs/BACKUP_POSTGRES.md): backup e restauração do banco.
- [docs/OBSERVABILIDADE.md](docs/OBSERVABILIDADE.md): logs, traces e métricas com OpenTelemetry e LGTM.
- [SECURITY.md](SECURITY.md): política de segurança.

## Licença

Distribuído sob a licença Apache 2.0. Veja [LICENSE](LICENSE).
