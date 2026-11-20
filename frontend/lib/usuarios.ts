export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  primeiroAcessoEm?: string | null;
  possuiSenhaLocal?: boolean;
}

export interface UsuarioRequestDTO {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export type PerfilUsuario = "ADMIN" | "NUTRICIONISTA" | "COZINHA";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

import {
  garantirSessaoAtiva,
  tratarSessaoExpiradaSe401,
} from "./authSession";

export interface UsuarioEdicaoDTO {
  nome: string;
  perfil: PerfilUsuario;
}

function obterHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return garantirSessaoAtiva(
    "Sessão expirada. Faça login novamente como Administrador."
  ) && {
    ...garantirSessaoAtiva("Sessão expirada. Faça login novamente como Administrador."),
    ...extra,
  };
}

export async function listarUsuarios(): Promise<UsuarioDTO[]> {
  const res = await fetch(`${BASE_URL}/usuarios`, {
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
        `Erro ao listar usuários (${res.status})`
    );
  }

  return res.json();
}

export async function cadastrarUsuario(
  dados: UsuarioRequestDTO
): Promise<UsuarioDTO> {
  const res = await fetch(`${BASE_URL}/usuarios`, {
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
        `Erro ao cadastrar usuário (${res.status})`
    );
  }

  return res.json();
}

export async function editarUsuario(
  id: string,
  dados: UsuarioEdicaoDTO
): Promise<UsuarioDTO> {
  const res = await fetch(`${BASE_URL}/usuarios/${id}`, {
    method: "PATCH",
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
        `Erro ao editar usuário (${res.status})`
    );
  }

  return res.json();
}

export async function desativarUsuario(id: string): Promise<UsuarioDTO> {
  const res = await fetch(`${BASE_URL}/usuarios/${id}/desativar`, {
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
        `Erro ao desativar usuário (${res.status})`
    );
  }

  return res.json();
}

export async function definirSenhaUsuario(
  id: string,
  senha: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/usuarios/${id}/senha`, {
    method: "PUT",
    headers: obterHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ senha }),
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao definir senha do usuário (${res.status})`
    );
  }
}

export async function removerSenhaUsuario(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/usuarios/${id}/senha`, {
    method: "DELETE",
    headers: obterHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao remover senha do usuário (${res.status})`
    );
  }
}
