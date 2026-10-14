# Estratégia de CI/CD

## Diagnóstico da base

O repositório é um monorepo com frontend Next.js 16/TypeScript, API Spring Boot 4/Java 21,
PostgreSQL 16 e migrações Flyway. O backend possui 120 testes JUnit distribuídos entre testes
unitários, integração com Testcontainers e autorização por perfil. O frontend ainda não possui
suíte automatizada; por isso o gate atual cobre lint, tipos e build, sem simular testes que não
existem.

Antes desta revisão, as automações tinham cinco problemas bloqueantes:

- `npm ci` era executado enquanto `frontend/package-lock.json` estava ignorado;
- o CI chamava `npm test`, mas esse script não existe;
- o backend Maven estava configurado como npm no Dependabot;
- a versão dependia da criação manual de tags e havia dois workflows publicando as mesmas imagens;
- o deploy de produção usava a tag fixa `0.0.1`, e o deploy de desenvolvimento não aguardava o CI.

## Fluxo proposto

```text
feature/* -> pull request -> develop -> imagem dev-<sha> -> ambiente development
                 |              |
                 |              +-- somente após CI aprovado
                 |
                 +-- lint + tipos + build + 120 testes + Trivy + Docker build/scan

develop -> pull request -> main -> Release Please -> PR de release
                                           |
                                   merge do PR de release
                                           |
                         tag vX.Y.Z + GitHub Release + imagens X.Y.Z
                                           |
                         aprovação do environment production -> deploy
```

O artefato implantado sempre é identificado por uma tag imutável (`dev-<sha>` em desenvolvimento
e `X.Y.Z` em produção). As tags móveis `dev` e `latest` existem apenas para conveniência e nunca
são usadas pelo script de deploy.

## Versionamento automático

O `release-please` lê Conventional Commits em `main`, mantém um PR de release com changelog e
calcula SemVer sem alterar arquivos do frontend ou backend:

- `fix:` gera PATCH;
- `feat:` gera MINOR;
- `feat!:` ou `BREAKING CHANGE:` gera MAJOR;
- `chore:`, `docs:`, `test:` e `ci:` entram no histórico, mas não elevam a versão sozinhos.

Ao mesclar o PR de release, a automação cria `vX.Y.Z`, a GitHub Release e as tags das imagens.
`frontend/package.json` e `backend/pom.xml` permanecem sob controle das equipes das aplicações.
A versão inicial registrada para releases é `0.1.0`.

## Gates de qualidade e segurança

O workflow consolidado `CI / Security / Release` é obrigatório antes de merge/deploy:

1. frontend: instalação reproduzível, ESLint, verificação de tipos, auditoria de dependências e build de produção;
2. backend: `mvn clean verify`, incluindo unitários, integração, Flyway e RBAC;
3. segurança: SAST com Semgrep e Dependency Review nas pull requests;
4. containers: build real das duas imagens;
5. Trivy centralizado: um único estágio verifica o repositório e as duas imagens, bloqueando
   achados HIGH/CRITICAL no código/configuração e CVEs CRITICAL corrigíveis nas imagens;
6. registry: somente imagens que passaram por todos os gates são publicadas no GHCR.

O mesmo workflow também roda toda segunda-feira, capturando vulnerabilidades divulgadas depois
do merge. O CodeQL permanece habilitado pelo Default Setup do GitHub, sem uma segunda configuração
avançada conflitante. O Dependabot cobre npm, Maven, imagens Docker e GitHub Actions.

O `frontend/package-lock.json` é versionado e o workflow usa `npm ci`, garantindo uma instalação
reproduzível das dependências.

Os scans podem bloquear a primeira execução por vulnerabilidades já existentes nas dependências
das aplicações. Esse comportamento é intencional: a esteira não altera nem cria exceções para o
frontend/backend. A correção ou uma dispensa temporária documentada deve ser decidida pelas
respectivas equipes antes da promoção da imagem.

## Deploy e rollback

`develop` é implantada somente após a conclusão bem-sucedida do workflow consolidado. O pipeline
compila a revisão exata, verifica e publica as imagens `dev-<sha>` antes de acionar o deploy.

Em produção, a imagem `sha-<commit>` já analisada é promovida, sem rebuild, para as tags `X.Y.Z`,
`vX.Y.Z` e `latest`. O job usa o GitHub Environment
`production`, onde deve haver aprovação manual. Depois do `docker compose up`, o servidor testa
o Actuator e a página inicial por até 180 segundos. Falha de saúde restaura automaticamente a
última tag bem-sucedida registrada no host.

## Configuração necessária no GitHub

Crie os environments `development` e `production`; no segundo, configure required reviewers e
restrinja o branch a `main`. Cadastre:

| Environment | Secret/variable | Uso |
|---|---|---|
| development | `DEV_HOST`, `DEV_USER`, `DEV_SSH_KEY`, `DEV_SSH_KNOWN_HOSTS` | acesso SSH |
| development | `DEVELOPMENT_URL` (variable) | URL exibida no deployment |
| production | `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS` | acesso SSH |
| production | `PRODUCTION_URL` (variable) | URL exibida no deployment |
| repository | `RELEASE_PLEASE_TOKEN` | token de GitHub App/PAT para o PR de release disparar o CI |

`*_SSH_KNOWN_HOSTS` deve conter a chave do host previamente conferida; não use descoberta por
`ssh-keyscan` durante o deploy. No servidor, `/opt/gestao-refeitorio/.env` deve existir com os
segredos da aplicação. Se os pacotes GHCR forem privados, faça `docker login ghcr.io` no host com
uma credencial somente de leitura.

Sem `RELEASE_PLEASE_TOKEN`, o workflow usa `GITHUB_TOKEN` como fallback, mas o GitHub não dispara
novos workflows para o PR criado por esse token. Para que o PR automático receba os checks
obrigatórios, prefira um GitHub App token ou PAT de uma conta técnica com acesso mínimo a
contents e pull requests.

Proteja `develop` e `main` exigindo os jobs de frontend, backend, segurança e imagens do workflow
`CI / Security / Release`; em `main`, exija também o CodeQL padrão se o plano do GitHub oferecer
Advanced Security. Desabilite push direto e exija ao menos uma revisão.

## Evolução recomendada

1. versionar o lockfile e adicionar testes de componentes/E2E do frontend quando a equipe autorizar;
2. publicar SBOM e assinar imagens com OIDC/Sigstore;
3. mover o JWT do `localStorage` para cookie `HttpOnly`, aplicar CSP e parametrizar CORS;
4. colocar TLS/reverse proxy na frente dos containers e automatizar backup/restore do PostgreSQL;
5. adotar migração expand/contract para permitir rollback de aplicação após mudanças de schema.
