# ADR 0004: Esteira DevSecOps (SAST/SCA), Assinatura Keyless com Cosign, SBOM e Rollback Consciente de Schema

- **Status:** Aceito
- **Issues Relacionadas:** `#223`, `#227`, `#282`, `#314`, `#322`, `#353`, `#362`

## Contexto

Para garantir que nenhuma alteração insegura ou quebrada chegue ao ambiente de produção na OCI, o processo de integração e entrega contínua precisava bloquear automaticamente falhas de testes, vulnerabilidades estáticas de código (SAST), bibliotecas ou imagens Docker vulneráveis (SCA), além de assegurar a autenticidade das imagens publicadas no GitHub Container Registry (GHCR) e evitar que um rollback automático de container quebrasse o banco após migrations destrutivas do Flyway.

## Decisão

1. **Gates Obrigatórios de Qualidade e Segurança (`.github/workflows/pipeline.yml`):**
   - **Frontend:** `npm ci`, ESLint sem warnings, `tsc --noEmit`, testes automatizados e cobertura ($\ge 70\%$) com Vitest (`npm run test:coverage`), `npm audit` e `npm run build`.
   - **Backend:** `mvn clean verify` executando testes unitários, de autorização RBAC e de integração com PostgreSQL via Testcontainers.
   - **SAST e SCA:** Semgrep (`p/default --error`), CodeQL, GitHub Dependency Review (bloqueando severidade `high`/`critical` em PRs), Dependabot semanal e varredura Trivy (`HIGH,CRITICAL`) tanto no repositório (`secret,misconfig`) quanto nas imagens Docker construídas.
2. **Integridade da Cadeia de Suprimentos (Cosign + SBOM SPDX):**
   - Todas as GitHub Actions são fixadas por hash SHA de 40 caracteres.
   - Imagens publicadas na `main` e em releases SemVer (geradas via *Release Please*) são assinadas de forma *keyless* (OIDC Sigstore) com **Cosign** e acompanhadas de **SBOMs** no formato SPDX JSON anexados à release.
3. **Deploy com Verificação de Assinatura, Health Check e Rollback Seguro (`scripts/deploy-remote.sh`):**
   - Antes de subir os containers em produção, o servidor verifica a assinatura Cosign das imagens contra a identidade do workflow oficial do repositório.
   - Após o `docker compose up`, o script aguarda a saúde do `/actuator/health` e do frontend. Se falhar e o Flyway **não** tiver avançado a versão do schema, realiza rollback automático para a tag anterior; caso o schema já tenha avançado, cancela o rollback de imagem incompatível e emite diagnóstico sanitizado (mascarando e-mails nos logs).

## Consequências

- **Positivas:**
  - Bloqueio preventivo de regressões funcionais e vulnerabilidades antes do merge na `main` (Nível 4 de Automação e Bloqueio).
  - Garantia criptográfica de proveniência das imagens em produção e proteção contra indisponibilidade por incompatibilidade de schema em rollbacks.
- **Negativas / Trade-offs:**
  - Maior tempo de execução da pipeline de CI/CD devido ao build real das imagens, execução do Testcontainers e varreduras completas do Semgrep e Trivy.
