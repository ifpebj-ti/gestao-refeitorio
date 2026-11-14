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

