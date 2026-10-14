export const STORAGE_TOKEN_KEY = "@gestao_refeitorio:token";
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
    // Se o token não tiver claim de expiração ou for inválido, considera expirado por segurança
    return true;
  }

  // payload.exp é em segundos UNIX; Date.now() é em milissegundos
  // Adiciona 5 segundos de tolerância contra pequenas variações de relógio
  return payload.exp * 1000 <= Date.now() + 5000;
}

/**
 * Limpa todos os dados da sessão local no localStorage.
 */
export function limparSessaoLocal(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_PERFIL_KEY);
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
