# ADR 0001: Autenticação Híbrida (Google OIDC e Login Local com BCrypt) e Autorização Stateless com JWT

- **Status:** Aceito
- **Issues Relacionadas:** `#11`, `#62`, `#68`, `#226`, `#229`, `#342`, `#365`, `#366`, `#367`, `#368`

## Contexto

O sistema de Gestão de Refeitório do IFPE Campus Belo Jardim atende três perfis de acesso distintos (`ADMIN`, `NUTRICIONISTA` e `COZINHA`) sem permitir auto-cadastro. Inicialmente, o login foi projetado exclusivamente com contas institucionais via Google OAuth2/OIDC. Contudo, a operação real e as baterias de auditoria e testes de segurança demandaram também a possibilidade de autenticação direta por e-mail e senha gerenciada pelo Administrador, mantendo controle rigoroso de sessão, proteção contra força bruta e separação clara entre falta de autenticação (`401`) e falta de permissão (`403`).

## Decisão

1. **Autenticação Híbrida sem Auto-Cadastro:**
   - **Google OAuth2/OIDC (`POST /api/auth/google`):** O backend valida criptograficamente o `id_token` recebido junto ao Google (`GoogleIdTokenVerifier`) e verifica se o e-mail já está pré-cadastrado e ativo na tabela `usuarios`.
   - **Login Local com E-mail e Senha (`POST /api/auth/local`):** Usuários previamente cadastrados para os quais o `ADMIN` definiu uma senha local (mínimo de 12 caracteres, armazenada exclusivamente como hash `BCrypt` em `usuarios.senha_hash`) podem autenticar-se diretamente.
   - **Proteção contra Força Bruta:** Após 5 tentativas inválidas consecutivas para o mesmo e-mail, o login local é bloqueado temporariamente por 15 minutos (`429 Too Many Requests` com cabeçalho `Retry-After`). Respostas de falha de login devolvem sempre mensagem genérica (`401`) para impedir enumeração de usuários.
2. **Emissão de JWT Próprio e Proteção CSRF Híbrida:**
   - Após autenticar por qualquer um dos dois fluxos, o backend emite um token JWT assinado com `JWT_SECRET` (validado na subida e obrigatório em produção) e tempo de expiração diferenciado por perfil (`24h` para `ADMIN`/`NUTRICIONISTA` e `72h` para `COZINHA`).
   - Requisições que alteram estado (`POST`, `PUT`, `PATCH`, `DELETE`) autenticadas apenas por cookie exigem token CSRF (`CookieCsrfTokenRepository` com `SameSite=Lax` e `Secure` em produção), enquanto chamadas de API com cabeçalho explícito `Authorization: Bearer <token>` ficam isentas de bloqueio CSRF por não serem forjáveis via formulários cross-origin.
3. **RBAC no Backend (`@PreAuthorize`):**
   - Todas as regras de autorização por perfil (`ADMIN`, `NUTRICIONISTA`, `COZINHA`) são impostas nos controllers do Spring Security via `@PreAuthorize`.

## Consequências

- **Positivas:**
  - Independência de provedor externo para contas operacionais ou auditorias técnicas quando necessário, mantendo a conveniência do SSO institucional Google.
  - Segregação estrita de funções: o perfil `ADMIN` gerencia apenas usuários e senhas, sem acesso às operações de estoque ou cardápio.
  - Mitigação de ataques de força bruta, enumeração de contas e CSRF.
- **Negativas / Trade-offs:**
  - Sendo o JWT stateless, a revogação imediata antes da expiração depende da inativação do usuário no banco (verificada pelo `JwtAuthFilter` a cada requisição) ou da rotação do segredo.
