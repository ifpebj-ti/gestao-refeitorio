let inMemoryToken: string | null = null;

export const SESSION_TOKEN_KEY = "@gestao_refeitorio:token_session";
export const STORAGE_TOKEN_KEY = "@gestao_refeitorio:token"; // Mantido para limpeza automática de legados
export const STORAGE_USER_KEY = "@gestao_refeitorio:user";
export const STORAGE_PERFIL_KEY = "@gestao_refeitorio:perfil_ativo";
export const EVENTO_SESSAO_EXPIRADA = "gestao_refeitorio:sessao_expirada";

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

  // payload.exp é em segundos UNIX; Date.now() é em milissegundos
  // Adiciona 5 segundos de tolerância contra pequenas variações de relógio
  return payload.exp * 1000 <= Date.now() + 5000;
}

/**
 * Obtém o token JWT ativo em memória ou sessão volátil da aba (sessionStorage).
 * Garante que o token NUNCA seja lido de ou mantido no localStorage em texto puro.
 */
export function getToken(): string | null {
  if (inMemoryToken) {
    if (isTokenExpirado(inMemoryToken)) {
      limparSessaoLocal();
      notificarSessaoExpirada();
      return null;
    }
    return inMemoryToken;
  }

  if (typeof window !== "undefined") {
    try {
      // Remove resíduo legado do localStorage caso ainda exista
      if (localStorage.getItem(STORAGE_TOKEN_KEY)) {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
      }

      const sessaoToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (sessaoToken) {
        if (isTokenExpirado(sessaoToken)) {
          limparSessaoLocal();
          notificarSessaoExpirada();
          return null;
        }
        inMemoryToken = sessaoToken;
        return inMemoryToken;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Salva o token JWT de forma protegida contra XSS no armazenamento em memória e sessão volátil da aba.
 * Purga ativamente o token do localStorage permanente.
 */
export function salvarSessaoToken(token: string | null): void {
  inMemoryToken = token;
  if (typeof window === "undefined") return;

  try {
    // Purga qualquer token do localStorage
    localStorage.removeItem(STORAGE_TOKEN_KEY);

    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch (e) {
    console.error("Erro ao salvar token de sessão:", e);
  }
}

/**
 * Limpa todos os dados da sessão local (memória, sessionStorage e dados públicos do localStorage).
 */
export function limparSessaoLocal(): void {
  inMemoryToken = null;
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_PERFIL_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch (e) {
    console.error("Erro ao limpar sessão local:", e);
  }
}

/**
 * Dispara evento global notificando a expiração da sessão para que o contexto de autenticação
 * e a interface atualizem seu estado e redirecionem o usuário para o login.
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
