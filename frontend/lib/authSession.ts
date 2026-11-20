let inMemoryToken: string | null = null;

export const SESSION_TOKEN_KEY = "@gestao_refeitorio:token_session"; // Mantido apenas para purga de legados
export const STORAGE_TOKEN_KEY = "@gestao_refeitorio:token"; // Mantido apenas para purga de legados
export const STORAGE_USER_KEY = "@gestao_refeitorio:user";
export const STORAGE_PERFIL_KEY = "@gestao_refeitorio:perfil_ativo";
export const AUTH_SESSION_COOKIE = "auth_session";
export const EVENTO_SESSAO_EXPIRADA = "gestao_refeitorio:sessao_expirada";

const WINDOW_NAME_PREFIX = "__gr_jwt:";

export interface JwtPayload {
  sub?: string;
  perfil?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decodifica o payload de um token JWT sem a necessidade de bibliotecas externas.
 */
export function decodificarPayloadJwt(token: string): JwtPayload | null {
  if (!token || typeof token !== "string") return null;

  try {
    const partes = token.split(".");
    if (partes.length !== 3) return null;

    let base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }

    if (typeof window === "undefined") {
      const buff = Buffer.from(base64, "base64");
      return JSON.parse(buff.toString("utf-8"));
    }

    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const decodedText = new TextDecoder().decode(bytes);
    return JSON.parse(decodedText);
  } catch {
    return null;
  }
}

/**
 * Verifica se um token JWT está expirado ou se é inválido.
 * Retorna true se estiver expirado, inválido ou nulo.
 */
export function isTokenExpirado(token: string | null): boolean {
  if (!token) return true;

  const payload = decodificarPayloadJwt(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + 5000;
}

function purgarTokensEmWebStorage(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(STORAGE_TOKEN_KEY)) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
    if (sessionStorage.getItem(SESSION_TOKEN_KEY)) {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {}
}

function lerTokenDeWindowName(): string | null {
  if (typeof window === "undefined" || typeof window.name !== "string") {
    return null;
  }
  if (window.name.startsWith(WINDOW_NAME_PREFIX)) {
    return window.name.slice(WINDOW_NAME_PREFIX.length) || null;
  }
  return null;
}

function gravarTokenEmWindowName(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.name = `${WINDOW_NAME_PREFIX}${token}`;
    } else if (
      typeof window.name === "string" &&
      window.name.startsWith(WINDOW_NAME_PREFIX)
    ) {
      window.name = "";
    }
  } catch {}
}

function atualizarCookieIndicadorSessao(ativo: boolean): void {
  if (typeof document === "undefined") return;
  try {
    if (ativo) {
      document.cookie = `${AUTH_SESSION_COOKIE}=1; Path=/; SameSite=Lax`;
    } else {
      document.cookie = `${AUTH_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  } catch {}
}

/**
 * Obtém o token JWT ativo em memória volátil da aba (sem nunca usar localStorage ou sessionStorage — #422).
 */
export function getToken(): string | null {
  purgarTokensEmWebStorage();

  const candidato = inMemoryToken || lerTokenDeWindowName();
  if (candidato) {
    if (isTokenExpirado(candidato)) {
      limparSessaoLocal();
      notificarSessaoExpirada();
      return null;
    }
    inMemoryToken = candidato;
    return inMemoryToken;
  }

  return null;
}

/**
 * Mantém o token apenas no contexto volátil de memória da janela e purga localStorage e sessionStorage (#422).
 */
export function salvarSessaoToken(token: string | null): void {
  inMemoryToken = token;
  if (typeof window === "undefined") return;

  try {
    purgarTokensEmWebStorage();
    gravarTokenEmWindowName(token);
    atualizarCookieIndicadorSessao(Boolean(token));
  } catch (e) {
    console.error("Erro ao atualizar estado de sessão:", e);
  }
}

/**
 * Extrai o token CSRF do cookie XSRF-TOKEN caso esteja visível ao cliente.
 */
export function obterCsrfToken(): string | null {
  if (typeof document === "undefined" || !document.cookie) return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="));
  if (!match) return null;
  const valor = match.split("=")[1];
  return valor ? decodeURIComponent(valor) : null;
}

/**
 * Verifica se há sessão autenticada ativa.
 */
export function possuiSessaoAtiva(): boolean {
  const token = getToken();
  if (token) return true;

  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem(STORAGE_USER_KEY)) {
        return true;
      }
      if (
        typeof document !== "undefined" &&
        document.cookie.includes(`${AUTH_SESSION_COOKIE}=1`)
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Monta os cabeçalhos para chamadas autenticadas à API:
 * - Inclui Authorization: Bearer <token> para que o backend autentique e isente a chamada do bloqueio CSRF de cookie.
 * - Inclui X-XSRF-TOKEN caso o cookie XSRF-TOKEN esteja acessível.
 */
export function obterHeadersAutenticados(
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const csrf = obterCsrfToken();
  if (csrf) {
    headers["X-XSRF-TOKEN"] = csrf;
  }
  return headers;
}

/**
 * Garante que existe uma sessão ativa antes de disparar chamadas protegidas e devolve os cabeçalhos.
 */
export function garantirSessaoAtiva(
  mensagemErro = "Sessão expirada. Faça login novamente."
): Record<string, string> {
  if (!possuiSessaoAtiva()) {
    limparSessaoLocal();
    notificarSessaoExpirada();
    throw new Error(mensagemErro);
  }
  return obterHeadersAutenticados();
}

/**
 * Limpa todos os dados da sessão local (memória, window.name, indicador de sessão e resíduos em storage).
 */
export function limparSessaoLocal(): void {
  inMemoryToken = null;
  if (typeof window === "undefined") return;

  try {
    gravarTokenEmWindowName(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_PERFIL_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    atualizarCookieIndicadorSessao(false);
  } catch (e) {
    console.error("Erro ao limpar sessão local:", e);
  }
}

/**
 * Dispara evento global notificando a expiração da sessão.
 */
export function notificarSessaoExpirada(): void {
  if (typeof window === "undefined") return;

  try {
    window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA));
  } catch (e) {
    console.error("Erro ao notificar sessão expirada:", e);
  }
}

/**
 * Helper para verificar status 401 (Unauthorized) e disparar limpeza e notificação de expiração.
 */
export function tratarSessaoExpiradaSe401(status: number): boolean {
  if (status === 401) {
    limparSessaoLocal();
    notificarSessaoExpirada();
    return true;
  }
  return false;
}
