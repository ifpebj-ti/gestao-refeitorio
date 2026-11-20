import {
  garantirSessaoAtiva,
  tratarSessaoExpiradaSe401,
} from "./authSession";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface RemetenteDTO {
  id: string;
  nome: string;
  documento?: string | null;
  contato?: string | null;
  ativo: boolean;
  criadoEm?: string;
}

export interface RemetenteRequestDTO {
  nome: string;
  documento?: string;
  contato?: string;
}

function obterHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    ...garantirSessaoAtiva("Sessão expirada. Faça login como Nutricionista."),
    ...extra,
  };
}

export async function listarRemetentes(ativo?: boolean): Promise<RemetenteDTO[]> {
  const query = typeof ativo === "boolean" ? `?ativo=${ativo}` : "";
  const res = await fetch(`${BASE_URL}/remetentes${query}`, {
    headers: obterHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao listar remetentes (${res.status})`
    );
  }

  return res.json();
}

export async function buscarRemetentePorId(id: string): Promise<RemetenteDTO> {
  const res = await fetch(`${BASE_URL}/remetentes/${id}`, {
    headers: obterHeaders(),
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao buscar remetente (${res.status})`
    );
  }

  return res.json();
}

export async function cadastrarRemetente(
  dados: RemetenteRequestDTO
): Promise<RemetenteDTO> {
  const res = await fetch(`${BASE_URL}/remetentes`, {
    method: "POST",
    headers: obterHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao cadastrar remetente (${res.status})`
    );
  }

  return res.json();
}

export async function editarRemetente(
  id: string,
  dados: RemetenteRequestDTO
): Promise<RemetenteDTO> {
  const res = await fetch(`${BASE_URL}/remetentes/${id}`, {
    method: "PUT",
    headers: obterHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao editar remetente (${res.status})`
    );
  }

  return res.json();
}

export async function inativarRemetente(id: string): Promise<RemetenteDTO> {
  const res = await fetch(`${BASE_URL}/remetentes/${id}/inativar`, {
    method: "PATCH",
    headers: obterHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao inativar remetente (${res.status})`
    );
  }

  return res.json();
}

export async function reativarRemetente(id: string): Promise<RemetenteDTO> {
  const res = await fetch(`${BASE_URL}/remetentes/${id}/reativar`, {
    method: "PATCH",
    headers: obterHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao reativar remetente (${res.status})`
    );
  }

  return res.json();
}
