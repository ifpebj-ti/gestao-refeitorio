# ADR 0003: Gestão de Sessão no Frontend e Hardening de Cabeçalhos HTTP (AppSec)

- **Status:** Aceito
- **Issues Relacionadas:** `#226`, `#358`, `#359`, `#381`

## Contexto

Aplicações SPA/SSR construídas com Next.js que consomem APIs REST via JWT estão sujeitas a riscos de persistência indevida de credenciais no navegador, ataques de *Cross-Site Scripting* (XSS), *Clickjacking*, *MIME-sniffing* e exposição acidental de variáveis de ambiente no bundle cliente (`NEXT_PUBLIC_*`). Além disso, ferramentas de análise dinâmica (DAST como OWASP ZAP) verificam a presença de cabeçalhos defensivos padronizados e restrições de execução de scripts.

## Decisão

1. **Armazenamento Volátil de Token e Purga de `localStorage` (`frontend/lib/authSession.ts`):**
   - O token JWT não é armazenado em `localStorage`. Ele é mantido em variável em memória (`inMemoryToken`) combinada com `sessionStorage` (escopo restrito à aba ativa e limpo ao fechar o navegador), além de envio de `credentials: "include"` para suportar cookies `HttpOnly`.
   - Qualquer chave legada em `localStorage` é ativamente removida, e a expiração (`exp`) do JWT é verificada proativamente antes de cada requisição, ao focar a aba ou ao receber HTTP `401`.
   - Senhas digitadas no login local jamais são persistidas em storage ou logs e são limpas do estado do componente ao alternar telas ou falhar.
2. **Cabeçalhos de Segurança HTTP (`frontend/next.config.js`):**
   - Desativação do cabeçalho `X-Powered-By` (`poweredByHeader: false`).
   - Aplicação global de `Content-Security-Policy` (CSP), `Strict-Transport-Security` (`max-age=31536000; includeSubDomains`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
   - Na diretiva `script-src` do CSP, `'unsafe-eval'` é incluído apenas em desenvolvimento (`NODE_ENV !== 'production'`) para suportar o hot-reload do Next.js, sendo removido nas builds de produção.

## Consequências

- **Positivas:**
  - Redução significativa da superfície de ataque contra XSS, Clickjacking e persistência de tokens em máquinas compartilhadas no refeitório/campus.
  - Conformidade direta com verificações dinâmicas de segurança (DAST / OWASP ZAP) e verificação automatizada dos headers na suíte Vitest.
- **Negativas / Trade-offs:**
  - Como o `sessionStorage` é isolado por aba, abrir a aplicação em uma nova aba independente requer nova autenticação caso o cookie de sessão não esteja ativo no ambiente.
