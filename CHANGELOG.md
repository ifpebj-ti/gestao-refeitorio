# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo. O versionamento segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/) e as próximas versões são mantidas automaticamente pelo Release Please a partir de commits no padrão Conventional Commits.

## [Não publicado]

### Adicionado

- Build e publicação das imagens de frontend e backend para `linux/amd64` e `linux/arm64`.
- Modelagem de dados baseada nas migrations Flyway e entidades JPA atuais.

### Alterado

- Promoção das imagens de release por manifesto OCI, preservando todas as arquiteturas publicadas.
- Consolidação dos workflows de CI, segurança, publicação, release e deploy.
- Fortalecimento das verificações de segurança com Semgrep, Trivy e análise de dependências.

### Corrigido

- Compatibilidade do build do backend com Java 21.
- Isolamento da análise do repositório contra falsos positivos de dependências Maven.
- Tratamento de falhas e limites de conexão no deploy por SSH.

## [0.3.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.2.0...gestao-refeitorio-v0.3.0) — 2026-09-24

### Adicionado

- Interface de visualização e gestão de cardápio semanal.
- Telas de recebimento de insumos e registro de consumo diário.
- Central de alertas de estoque baixo e controle de validade.
- Splash screen para seleção de perfil.

### Alterado

- Melhorias de responsividade para dispositivos móveis.
- Ajustes gerais de layout e limpeza de código.

## [0.2.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/0.0.1...gestao-refeitorio-v0.2.0) — 2026-09-22

### Adicionado

- Autenticação por Google OAuth2, emissão de JWT e controle de acesso por perfil.
- Gestão de usuários pelo perfil administrador.
- Cadastro, consulta, edição e filtros de produtos.
- Registro de entradas e saídas de estoque com validação de saldo.
- Histórico de movimentações, saldo total e saldo por local.
- Anexo e consulta de fotos das movimentações.
- Catálogo inicial de produtos por migration Flyway.
- Conteinerização para desenvolvimento e workflows iniciais de CI/CD e segurança.

### Alterado

- Atualização do backend para Spring Boot 4 e Java 21.
- Atualização do frontend para React 19 e Next.js 16.
- Separação das fotos de movimentações em tabela própria.
- Transferência da origem do produto para a movimentação de entrada.

### Corrigido

- Compatibilidade dos builds e migrations na pipeline.
- Usuários não privilegiados nas imagens Docker.
- Tratamento de respostas `401` e `403` na camada de segurança.
- Sincronização do lockfile de dependências do frontend.

## [0.0.1](https://github.com/ifpebj-ti/gestao-refeitorio/releases/tag/0.0.1) — 2026-09-17

### Adicionado

- Estrutura inicial do projeto.
- Primeira tag de versionamento do repositório.

[Não publicado]: https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.3.0...HEAD
