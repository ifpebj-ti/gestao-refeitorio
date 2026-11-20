# Frontend — Gestão de Refeitório (IFPE Campus Belo Jardim)

Interface web construída com **Next.js 16 (App Router)**, **React 19**, **TypeScript** e **Tailwind CSS 4**.

---

## Scripts Disponíveis

No diretório `frontend/`, execute:

```bash
# Servidor de desenvolvimento (http://localhost:3000)
npm run dev

# Verificação de lint e tipos
npm run lint
npx tsc --noEmit

# Execução dos testes automatizados (Vitest + Testing Library)
npm test

# Execução dos testes em modo watch
npm run test:watch

# Execução dos testes com relatório de cobertura (texto, HTML e LCOV em frontend/coverage/)
npm run test:coverage

# Build de produção
npm run build
```

---

## Infraestrutura de Testes Automatizados

O frontend utiliza **Vitest**, **React Testing Library**, **`@testing-library/jest-dom`**, **`jsdom`** e **`@vitest/coverage-v8`**:

- **Configuração:** `vitest.config.ts` e `vitest.setup.ts`
- **Localização dos testes:** `frontend/__tests__/`
- **Relatórios de cobertura:** gerados em `frontend/coverage/` (incluindo `lcov.info` e relatório HTML), com threshold mínimo configurado de **70%** para linhas, statements e funções.
- **Escopo coberto pelos testes:**
  - Fluxo de login e autenticação (`Google OAuth` e login local via `POST /api/auth/local` com tratamento de erros `401` e `429`).
  - Controle de acesso baseado em perfil (`RBAC`: `ADMIN`, `NUTRICIONISTA` e `COZINHA`) no `AuthContext`, `Sidebar` e rotas protegidas.
  - Gestão de usuários e senhas locais pelo `ADMIN` (listagem, filtros, cadastro com senha opcional, definição/redefinição de senha com validação de mínimo de 12 caracteres e remoção de senha).
  - Componentes de exibição e seleção (`CardapioCard`, `SeletorRefeicao`, `Sidebar`) e regras de negócio (`estoqueRules`, `alertasCount`, `unidades`, `authSession` e serviços de API).

---

## Segurança da Aplicação (AppSec / Hardening)

### 1. Security Headers (`next.config.js`)
O servidor Next.js aplica cabeçalhos de segurança HTTP em todas as rotas (`/(.*)`), além de ocultar o cabeçalho `X-Powered-By` (`poweredByHeader: false`):

- **`Content-Security-Policy` (CSP):** restringe origens de scripts, estilos, imagens, conexões e iframes exclusivamente ao próprio domínio (`'self'`), à origem configurada da API e aos endpoints oficiais do Google Identity Services (`https://accounts.google.com`, `https://apis.google.com` e `https://oauth2.googleapis.com`). Em produção (`NODE_ENV === 'production'`), diretivas de desenvolvimento (`'unsafe-inline'` e `'unsafe-eval'` em `script-src` e `http://localhost:8080`) e curingas amplos (`https:`) são removidos (`#428`).
- **`Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS):** instrui o navegador a comunicar-se exclusivamente via HTTPS (`#381`).
- **`X-Frame-Options: SAMEORIGIN`:** protege contra ataques de *Clickjacking* impedindo que a aplicação seja embutida em iframes de terceiros.
- **`X-Content-Type-Options: nosniff`:** bloqueia *MIME-sniffing* no navegador.
- **`Referrer-Policy: strict-origin-when-cross-origin`:** evita vazamento de caminhos internos e parâmetros de URL em requisições para origens externas.
- **`Permissions-Policy: camera=(), microphone=(), geolocation=()`:** desabilita APIs sensíveis do navegador não utilizadas pelo sistema.
- **Política de Cache das TVs (`/tv` e `/tv/:path*`):** aplica `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0` para evitar retenção de longa duração (`s-maxage=31536000`) em caches compartilhados (`#427`).
- **Proteção de Rotas no Servidor (`middleware.ts`) e Anti-Fingerprinting:** o middleware intercepta acessos anônimos a rotas autenticadas antes do SSR redirecionando para `/` (`#423`), enquanto `poweredByHeader: false`, `productionBrowserSourceMaps: false` e `images.unoptimized: true` reduzem a superfície de fingerprinting (`#429`).

### 2. Revisão de Variáveis `NEXT_PUBLIC_*`
Todas as variáveis prefixadas com `NEXT_PUBLIC_*` são embutidas no bundle JavaScript entregue ao navegador. Por isso, **nenhum segredo, chave privada ou `JWT_SECRET` utiliza esse prefixo**. As únicas variáveis públicas são:

| Variável | Finalidade | Classificação |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL base da API REST do backend | Pública |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Identificador público OAuth 2.0 do cliente Google Identity Services | Pública |

### 3. Decisão Arquitetural sobre Armazenamento de Sessão e Token JWT (`lib/authSession.ts`)
- **Onde a sessão é mantida:** o transporte principal de autenticação ocorre via cookie `HttpOnly` (`credentials: "include"`) com suporte ao cabeçalho `X-XSRF-TOKEN` do Spring Security, mantendo o JWT apenas em variável de memória volátil (`inMemoryToken`) durante a execução e **removendo o espelhamento em `sessionStorage` e `localStorage`** (`#422`).
- **Proteções implementadas:**
  - **Purga ativa de `localStorage` e `sessionStorage`:** qualquer resíduo legado nas chaves `@gestao_refeitorio:token` e `@gestao_refeitorio:token_session` é removido automaticamente para impedir persistência do JWT no Web Storage do navegador.
  - **Senhas nunca são armazenadas:** no login local (`POST /api/auth/local`), a senha jamais é gravada em `localStorage`, `sessionStorage` ou logs de console, e o input é limpo ao alternar de tela ou falhar autenticação.
  - **Validação proativa de expiração (`exp`):** antes de cada uso, `isTokenExpirado()` verifica o claim `exp` do JWT (com margem de segurança de 5s) e também executa checagens ao focar a aba, alterar visibilidade ou receber HTTP `401`, revogando imediatamente a sessão local.
- **Risco residual documentado:** como o cliente envia o header `Authorization: Bearer <token>` em chamadas cross-origin/API, o token em `sessionStorage`/memória ficaria exposto caso ocorresse uma vulnerabilidade de execução de script (XSS). Para mitigar esse risco em profundidade, o projeto aplica **CSP restritiva**, escapa entradas via React JSX, valida dependências na pipeline (`npm audit --audit-level=critical`, Semgrep SAST e Trivy) e mantém tempo curto de expiração do JWT.

