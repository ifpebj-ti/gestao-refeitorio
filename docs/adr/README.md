# Architecture Decision Records (ADRs)

Esta pasta reúne os registros de decisões arquiteturais (**ADRs**) do sistema **Gestão de Refeitório — IFPE Campus Belo Jardim**, adotando o modelo *Documentation as Code (Doc-as-Code)*.

Cada registro documenta o **Contexto** enfrentado, a **Decisão** escolhida (e seu impacto em segurança, desempenho e manutenibilidade) e as **Consequências** (prós, contras e riscos residuais).

## Índice de Decisões

| ADR | Título | Status |
| :--- | :--- | :--- |
| [0001](0001-autenticacao-hibrida-google-oidc-e-jwt-local.md) | Autenticação Híbrida (Google OIDC e Login Local com BCrypt) e Autorização Stateless com JWT | Aceito |
| [0002](0002-persistencia-postgresql-flyway-e-armazenamento-de-fotos.md) | Persistência em PostgreSQL com Flyway e Armazenamento Seguro de Fotos no Banco (`BYTEA`) | Aceito |
| [0003](0003-armazenamento-seguro-de-sessao-e-headers-appsec-frontend.md) | Gestão de Sessão no Frontend e Hardening de Cabeçalhos HTTP (AppSec) | Aceito |
| [0004](0004-esteira-ci-cd-seguranca-e-integridade-de-imagens.md) | Esteira DevSecOps (SAST/SCA), Assinatura Keyless com Cosign, SBOM e Rollback Consciente de Schema | Aceito |
