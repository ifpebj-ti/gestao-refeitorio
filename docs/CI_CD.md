# Estratégia de CI/CD

## Diagnóstico da base

O repositório é um monorepo com frontend Next.js 16/TypeScript, API Spring Boot 4/Java 21,
PostgreSQL 16 e migrações Flyway. O backend possui testes JUnit unitários e de integração,
incluindo Testcontainers, Flyway e autorização por perfil. O frontend possui testes automatizados
com Vitest, React Testing Library e jsdom para autenticação, componentes, utilitários e fluxos de
usuários.

Os dois lados da aplicação possuem gate de cobertura de 70%. No frontend, o Vitest exige o mínimo
para linhas, statements e funções; no backend, o JaCoCo exige 70% de linhas. Os relatórios HTML e
LCOV do frontend e os relatórios JaCoCo/Surefire do backend são publicados como artefatos da
execução por 14 dias.

Antes desta revisão, as automações tinham cinco problemas bloqueantes:

- `npm ci` era executado enquanto `frontend/package-lock.json` estava ignorado;
- o CI chamava `npm test`, mas esse script não existe;
- o backend Maven estava configurado como npm no Dependabot;
- a versão dependia da criação manual de tags e havia dois workflows publicando as mesmas imagens;
- o deploy de produção usava a tag fixa `0.0.1` e havia sobreposição entre fluxos de publicação.

## Fluxo proposto

```text
feature/* | fix/* | chore/*
             |
             v
pull request -> CI + Security -> checks obrigatórios -> main
                                                    |
                                                    v
                              CI publica badges de cobertura
                                                    |
                                                    v
                      Security publica imagens sha-<commit> assinadas
                                                    |
                                                    v
                                      dispara CD / Release
                         |
                         v
                  Release Please
                         |
                         v
                    PR de release
                         |
                         v
        tag vX.Y.Z + GitHub Release + imagens X.Y.Z
                         |
                         v
              environment production -> deploy
```

O artefato implantado sempre é identificado por uma tag imutável (`sha-<commit>` durante a
validação e `X.Y.Z` na release). A tag móvel `latest` existe apenas para conveniência e não é usada
como referência de rollback pelo script de deploy.

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

## Workflows e gates

As responsabilidades estão separadas em três workflows:

- **CI** (`ci.yml`): roda em pull requests e pushes na `main`; executa lint, tipos, testes,
  cobertura, auditoria de dependências e builds do frontend e backend. Os checks agregadores
  `CI / Required` e `Security / Required` são os gates estáveis exigidos na proteção da branch;
- **Security** (`security.yml`): roda em pull requests, pushes na `main` e semanalmente; executa
  Semgrep, Dependency Review, testes de infraestrutura, Trivy, build único das imagens e Cosign.
  Em pushes, aguarda a CI do mesmo SHA antes de publicar as imagens imutáveis e dispara o CD;
- **CD / Release** (`cd.yml`): somente pode ser iniciado por `workflow_dispatch`. Valida novamente
  que CI e Security aprovaram o HEAD atual da `main`, promove as imagens já assinadas, executa
  Release Please, gera SBOM/attestation e solicita aprovação do environment `production` antes do
  deploy. Não recompila as imagens.

Os gates preservados são:

1. frontend: instalação reproduzível, ESLint, verificação de tipos, testes Vitest com
   cobertura mínima de 70%, auditoria de dependências e build de produção;
2. backend: `mvn clean verify`, incluindo unitários, integração, Flyway, RBAC e gate JaCoCo de
   70% de cobertura de linhas;
3. segurança: SAST com Semgrep, CodeQL pelo Default Setup, `npm audit` e Dependency Review nas
   pull requests, bloqueando novas dependências de severidade HIGH/CRITICAL;
4. containers: build real das duas imagens;
5. Trivy centralizado: um único estágio verifica o repositório e as duas imagens, bloqueando
   secrets/misconfigurações e CVEs corrigíveis de severidade HIGH/CRITICAL;
6. registry e supply chain: somente imagens aprovadas são publicadas no GHCR, fixadas por digest,
   assinadas de forma keyless com Cosign/OIDC e acompanhadas de SBOM SPDX e attestation.
7. smoke de segurança: após o health check, verifica HTTPS, redirect, headers, cookies, Host/SNI,
   portas internas, endpoints administrativos, WAF e respostas de erro; falha crítica reprova o deploy;
8. DAST: depois de um deploy bem-sucedido, o OWASP ZAP Baseline verifica a URL HTTPS de produção,
   armazena os relatórios no artefato `zap-baseline-report` e bloqueia o job para as regras marcadas
   como `FAIL` em `.zap/rules.tsv`. Alertas não bloqueantes permanecem visíveis no relatório.

Cada imagem é construída uma única vez no workflow Security. O mesmo artefato local é analisado pelo
Trivy e, somente no push da `main` aprovado pela CI do mesmo SHA, publicado como `sha-<commit>` e
assinado. O `SECURITY_REFRESH` deriva do identificador da execução e invalida somente a camada que
executa `apk upgrade`, mantendo em cache as dependências npm/Maven. O download inicial possui
três tentativas com atualização forçada para tolerar indisponibilidades transitórias do Maven Central.

O workflow Security também roda toda segunda-feira, capturando vulnerabilidades divulgadas depois
do merge. O CodeQL permanece habilitado pelo Default Setup do GitHub, sem uma segunda configuração
avançada conflitante. O Dependabot cobre npm, Maven, imagens Docker e GitHub Actions.

O `startup_failure` do CodeQL foi encerrado mantendo uma única configuração: o Default Setup para
Actions, Java/Kotlin e JavaScript/TypeScript. Em 17/11/2026, os checks dos PRs #400 e #401
concluíram com sucesso e disponibilizaram os resultados na área de Code Scanning. Não deve ser
adicionado um workflow avançado paralelo enquanto o Default Setup estiver ativo.

Para imagens Docker, o Dependabot monitora somente os diretórios que possuem `Dockerfile`
(`frontend/` e `backend/`). Não existe uma entrada Docker para a raiz porque ali há apenas arquivos
Compose; manter `directory: /` fazia cada execução terminar com `Dependabot couldn't find a
Dockerfile`. A imagem PostgreSQL usada no Compose permanece fixada por digest; suas atualizações
devem ser revisadas manualmente, pois esse manifesto não é tratado pelo ecossistema Docker do
Dependabot.

O `frontend/package-lock.json` é versionado e o workflow usa `npm ci`, garantindo uma instalação
reproduzível das dependências. O comando `npm run test:coverage` executa a suíte Vitest e publica
o diretório `frontend/coverage/` como o artefato `frontend-coverage-report`, mesmo quando o gate
falha, facilitando o diagnóstico. O job usa Node 24, compatível com os requisitos do Vitest 5 e do
jsdom 31. O Dependabot mantém `vitest`, `@vitest/coverage-v8` e `jsdom` no grupo
`frontend-test-tooling`, evitando PRs isolados com versões principais incompatíveis.

## Badges automáticos de cobertura

Depois que os jobs de frontend e backend terminam com sucesso em um push da `main`, a CI baixa
`coverage-summary.json` do Vitest e `jacoco.csv` do JaCoCo. O script
`scripts/generate-coverage-badges.mjs` soma os contadores cobertos e totais das duas aplicações,
produzindo percentuais consolidados e ponderados para linhas e branches. Resultados ausentes,
malformados, vazios ou inconsistentes interrompem o job antes de qualquer publicação.

Os arquivos `coverage-lines.svg`, `coverage-branches.svg` e `coverage.json` são publicados de forma
atômica no branch dedicado `coverage-badges` pela Git Data API. O README referencia esses SVGs
diretamente. Como CI e Security observam apenas `main`, o commit automático nesse branch não cria
loops, e nenhum PAT adicional é necessário: a publicação usa o `GITHUB_TOKEN` efêmero com permissão
`contents: write` limitada ao job de badges.

Os scans podem bloquear a primeira execução por vulnerabilidades já existentes nas dependências
das aplicações. Esse comportamento é intencional: a esteira não altera nem cria exceções para o
frontend/backend. A correção ou uma dispensa temporária documentada deve ser decidida pelas
respectivas equipes antes da promoção da imagem. Exceções no `.trivyignore.yaml` devem ser
temporárias, possuir justificativa, prazo (`expired_at`) e ser removidas assim que a imagem ou a
dependência corrigida estiver disponível. Na revisão de 2026-11-16, as 16 exceções existentes
foram removidas após as imagens da última execução bem-sucedida da `main` apresentarem zero
achados HIGH/CRITICAL corrigíveis sem o arquivo de exceções. A revisão da issue #344, em 17/11/2026,
confirmou que o arquivo continua com `vulnerabilities: []`: não existe exceção ativa, justificativa
sem validade ou data de expiração pendente.

## Smoke tests de segurança de produção

O job `CD / Deploy production` executa, depois da validação de saúde e antes de concluir:

```bash
bash scripts/tests/production-security-smoke-test.sh "$PRODUCTION_URL" "$REPORT_FILE"
```

O teste é somente leitura, exceto pelo logout idempotente usado para validar os atributos do cookie.
Ele não cria massa, não usa credenciais e não consulta dados autenticados. São gates críticos:
HTTPS, redirect seguro, política única de headers, cookie `Secure`/`HttpOnly`/`SameSite=Lax`, recusa
de Host/SNI/IP arbitrário, portas 3000/8080 fechadas, Swagger/Actuator não públicos, bloqueios do WAF
e ausência de banners/stack traces. O artifact `production-security-smoke-report` é publicado mesmo
quando o teste falha e fica retido por 30 dias.

## DAST com OWASP ZAP

O job `Security / OWASP ZAP baseline` é disparado pelo CD depois de um deploy de produção concluído.
Também pode ser iniciado manualmente em **Actions → Security → Run workflow**, com
`run_dast` habilitado, para analisar a versão que já está implantada. O job não acessa o environment
protegido `production`, pois analisa somente uma URL pública e não utiliza secrets de deploy. A URL é
lida exclusivamente da repository variable `PRODUCTION_URL`; assim, a aprovação humana ocorre apenas
antes do deploy e o DAST começa automaticamente depois de um deploy bem-sucedido.

O scan é passivo e autenticado apenas quando variáveis próprias do ZAP forem configuradas no futuro;
nenhuma credencial da aplicação é enviada por padrão. As regras de headers, cookies e conteúdo misto
definidas em `.zap/rules.tsv` bloqueiam a esteira. Os demais alertas são registrados como evidência,
sem falhar o job, devido à opção `-I`. A action e a imagem do scanner estão fixadas por SHA/digest.

Cada execução publica os relatórios HTML, Markdown e JSON no artefato `zap-baseline-report`. Uma
falha deve ser tratada corrigindo a aplicação ou o proxy. Exceções só podem ser adicionadas ao arquivo
de regras com justificativa documentada e revisão de segurança.

## Deploy e rollback

Em produção, a imagem `sha-<commit>` já analisada e assinada pelo workflow Security é verificada pelo
CD e promovida, sem rebuild, para as tags `X.Y.Z`,
`vX.Y.Z` e `latest`. O job usa o GitHub Environment
`production`, que pode exigir aprovação manual por meio de suas regras de proteção. O deploy é
executado somente quando o Release Please cria uma versão e o job `publish-release` promove e assina
as imagens correspondentes. Um push comum na `main`, sem nova release, não inicia deploy e não
acessa o environment de produção.

Antes de trocar os containers, o script valida as assinaturas das imagens de release e executa o
`docker compose pull`. Se uma dessas etapas falhar, o deploy termina com erro sem executar rollback
ou recriar containers: a versão que já está em produção permanece inalterada.

Imediatamente antes do primeiro `docker compose up`, o script registra que a troca dos containers
começou. A partir desse ponto, o servidor testa o Actuator e a página inicial por até 600 segundos
(`HEALTH_TIMEOUT_SECONDS`; a VM leva mais de 180 s para subir uma versão com migrations novas).
Falha de saúde restaura automaticamente a última tag bem-sucedida registrada no host, **exceto**
quando a versão nova já migrou o banco.

O overlay `docker-compose.prod.yml` repassa `IMAGE_TAG` ao backend como `APP_VERSION`. Assim, o
endpoint de versão e o menu lateral exibem exatamente a tag implantada. O mesmo ocorre no rollback,
porque `deploy-remote.sh` redefine e exporta `IMAGE_TAG` antes de recriar os containers. Nenhuma
variável adicional precisa ser cadastrada no `.env` da VM.

Rollback e migrations (#322): o Flyway não desfaz migrations, e uma migration destrutiva (como o
`DROP COLUMN` da V23) impede a imagem anterior de subir. Por isso o script lê a versão do Flyway
antes e depois do deploy: se ela avançou, o rollback de imagem é cancelado, a versão nova continua
rodando e o job falha com a mensagem e um diagnóstico (estado do container, reinícios, OOM e linhas
de erro do backend, com e-mails mascarados, porque o log do Actions é público).

Recuperação manual na VM, quando for preciso fixar uma versão:

```bash
cd /opt/gestao-refeitorio
export IMAGE_TAG=<versão>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend   # até "Started"
echo "$IMAGE_TAG" > .image-tag-docker-compose.prod   # passa a ser a versão de rollback
```

Quando a rede `lgtm_default` existe no servidor, o deploy também conecta o backend ao LGTM; a
observabilidade (agente OpenTelemetry, desligado por padrão) está descrita em
[OBSERVABILIDADE.md](OBSERVABILIDADE.md).

A aplicação é disponibilizada por Nginx em `https://gestao-refeitorio-ifpe.duckdns.org`, com `/`
encaminhado ao frontend e `/api/` ao backend. O TLS é fornecido pelo Let's Encrypt e sua renovação
foi validada com `certbot renew --dry-run`. O Compose, o vhost, os limites, timeouts, rate limiting e
as exclusões pontuais do ModSecurity estão versionados em `infra/nginx`. A pipeline executa
`nginx -t` com a mesma imagem fixada por digest; certificados e chaves permanecem exclusivamente na
VM. O procedimento de comparação, instalação, reload e rollback está em
[NGINX_PROXY.md](NGINX_PROXY.md).

## Configuração necessária no GitHub

Use o environment `production`; quando aplicável, configure required reviewers e restrinja o
deploy à branch protegida `main`. Cadastre:

| Environment | Secret/variable | Uso |
|---|---|---|
| production | `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS` | acesso SSH |
| repository | `PRODUCTION_URL` (variable) | URL HTTPS pública exibida no deployment e analisada pelo OWASP ZAP |
| repository | `RELEASE_PLEASE_TOKEN` | token de GitHub App/PAT para o PR de release disparar o CI |

`*_SSH_KNOWN_HOSTS` deve conter a chave do host previamente conferida; não use descoberta por
`ssh-keyscan` durante o deploy. No servidor, `/opt/gestao-refeitorio/.env` deve existir com os
segredos da aplicação. Se os pacotes GHCR forem privados, faça `docker login ghcr.io` no host com
uma credencial somente de leitura.

Sem `RELEASE_PLEASE_TOKEN`, o workflow usa `GITHUB_TOKEN` como fallback, mas o GitHub não dispara
novos workflows para o PR criado por esse token. Para que o PR automático receba os checks
obrigatórios, prefira um GitHub App token ou PAT de uma conta técnica com acesso mínimo a
contents e pull requests.

Proteja `main` exigindo os checks agregadores `CI / Required` e `Security / Required`; exija também
o CodeQL padrão se o plano do GitHub oferecer Advanced Security. Desabilite push direto e exija ao
menos uma revisão. Os agregadores mantêm nomes estáveis enquanto os jobs internos podem evoluir.

O ruleset ativo `Proteção da main` foi revisado em 17/11/2026. Ele bloqueia exclusão e force-push,
exige PR com uma aprovação, invalida aprovações após novos pushes, exige resolução das conversas e
requer branch atualizada com os checks `CI / Required`, `Security / Required` e `CodeQL`. A ownership
versionada está em `.github/CODEOWNERS` e as convenções estão em `CONTRIBUTING.md`.

## Evolução recomendada

1. ampliar os testes do frontend para os demais fluxos críticos e adicionar E2E em navegador;
2. acompanhar a evolução da cobertura em relatórios históricos e elevar os thresholds gradualmente;
3. publicar proveniência verificável da build e evoluir os controles da cadeia para SLSA;
4. monitorar a renovação do TLS (o backup/restore do PostgreSQL já está em [BACKUP_POSTGRES.md](BACKUP_POSTGRES.md));
5. adotar migração expand/contract para permitir rollback de aplicação após mudanças de schema
   (remover coluna/tabela só numa release posterior àquela que deixou de usá-la).
