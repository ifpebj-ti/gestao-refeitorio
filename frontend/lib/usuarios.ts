export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface UsuarioRequestDTO {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export type PerfilUsuario = "ADMIN" | "NUTRICIONISTA" | "COZINHA";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

import {
  getToken as getAuthToken,
  limparSessaoLocal,
  notificarSessaoExpirada,
  tratarSessaoExpiradaSe401,
} from "./authSession";

export interface UsuarioEdicaoDTO {
  nome: string;
  perfil: PerfilUsuario;
}

function getToken(): string {
  const token = getAuthToken();
  if (!token) {
    limparSessaoLocal();
    notificarSessaoExpirada();
    throw new Error(
      "Sessão expirada. Faça login novamente como Administrador."
    );
  }
  return token;
}

export async function listarUsuarios(): Promise<UsuarioDTO[]> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/usuarios`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  const token = getToken();
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
  const token = getToken();
  const res = await fetch(`${BASE_URL}/usuarios/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
  const token = getToken();
  const res = await fetch(`${BASE_URL}/usuarios/${id}/desativar`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
