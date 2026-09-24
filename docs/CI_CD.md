# Estratégia de CI/CD

## Diagnóstico da base

O repositório é um monorepo com frontend Next.js 14/TypeScript, API Spring Boot 3/Java 21,
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

O workflow `CI` é obrigatório antes de merge/deploy:

1. frontend: instalação, auditoria de dependências e build de produção usando os scripts atuais;
2. backend: `mvn clean verify`, incluindo unitários, integração, Flyway e RBAC;
3. repositório: Trivy para CVEs, segredos e configuração insegura (HIGH/CRITICAL);
4. containers: build real das duas imagens e bloqueio por CVE CRITICAL corrigível.

O workflow `Security (deep scan)` complementa o gate com CodeQL para Java e JavaScript/TypeScript,
Dependency Review em PRs e publicação SARIF no Security tab. Ele também roda toda segunda-feira,
capturando vulnerabilidades divulgadas depois do merge. O Dependabot cobre npm, Maven, imagens
Docker e GitHub Actions.

Como `frontend/package-lock.json` é ignorado pela estrutura atual, o CI usa `npm install` em vez
de `npm ci`. Isso preserva o frontend sem alterações, mas reduz a reprodutibilidade. A geração e
versionamento do lockfile fica como decisão futura da equipe do frontend.

Os scans podem bloquear a primeira execução por vulnerabilidades já existentes nas dependências
das aplicações. Esse comportamento é intencional: a esteira não altera nem cria exceções para o
frontend/backend. A correção ou uma dispensa temporária documentada deve ser decidida pelas
respectivas equipes antes da promoção da imagem.

## Deploy e rollback

`develop` é implantada somente após a conclusão bem-sucedida do workflow `CI`. O pipeline compila
a revisão exata, verifica a imagem antes do push e implanta `dev-<sha>`.

Em produção, a imagem é construída a partir da tag criada pelo Release Please, verificada e
publicada como `X.Y.Z`, `vX.Y.Z`, `sha-<commit>` e `latest`. O job usa o GitHub Environment
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

Proteja `develop` e `main` exigindo os checks do `CI`; em `main`, exija também os checks CodeQL e
Dependency Review se o plano do GitHub oferecer Advanced Security. Desabilite push direto e exija
ao menos uma revisão.

## Evolução recomendada

1. versionar o lockfile e adicionar testes de componentes/E2E do frontend quando a equipe autorizar;
2. publicar SBOM e assinar imagens com OIDC/Sigstore;
3. mover o JWT do `localStorage` para cookie `HttpOnly`, aplicar CSP e parametrizar CORS;
4. colocar TLS/reverse proxy na frente dos containers e automatizar backup/restore do PostgreSQL;
5. adotar migração expand/contract para permitir rollback de aplicação após mudanças de schema.
