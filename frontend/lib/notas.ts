import {
  garantirSessaoAtiva,
  tratarSessaoExpiradaSe401,
} from "./authSession";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type StatusNota = "PENDENTE" | "VALIDADA" | "CANCELADA";
export type TipoNota = "EXTERNA" | "LOCAL";

export interface NotaEntradaDTO {
  movimentacaoId: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  unidadeMedida: string;
  localId: string;
  localNome: string;
  lote?: string | null;
  dataValidade?: string | null;
  data: string;
  fornecedor?: string | null;
}

export interface NotaResumoDTO {
  id: string;
  numero: string;
  tipo: TipoNota;
  data: string;
  remetenteNome: string;
  responsavelEntrega?: string | null;
  status: StatusNota;
  quantidadeEntradas: number;
  possuiDocumento: boolean;
}

export interface NotaResponseDTO {
  id: string;
  numero: string;
  tipo: TipoNota;
  data: string;
  status: StatusNota;
  remetente: {
    id: string;
    nome: string;
  };
  entradas: NotaEntradaDTO[];
  registradoPor: {
    id: string;
    nome: string;
    email: string;
  };
  observacoes?: string | null;
  responsavelEntrega?: string | null;
  possuiDocumento: boolean;
  decididoPor?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  decididoEm?: string | null;
  justificativaCancelamento?: string | null;
  criadoEm?: string;
}

export interface NotaRequestDTO {
  numero: string;
  data: string;
  remetenteId: string;
  movimentacaoIds: string[];
  observacoes?: string;
}

export interface NotaLocalRequestDTO {
  data: string;
  remetenteId: string;
  movimentacaoIds: string[];
  responsavelEntrega: string;
  observacoes?: string;
}

export interface NotaDocumentoResponseDTO {
  notaId: string;
  contentType: string;
  tamanhoBytes: number;
  criadoEm: string;
}

export interface FiltrosListagemNotas {
  status?: StatusNota | "";
  tipo?: TipoNota | "";
  remetenteId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface FiltrosEntradasDisponiveis {
  dataInicio?: string;
  dataFim?: string;
  produtoId?: string;
  fornecedor?: string;
}

function obterHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    ...garantirSessaoAtiva("Sessão expirada. Faça login como Nutricionista."),
    ...extra,
  };
}

export async function listarNotas(
  filtros: FiltrosListagemNotas = {}
): Promise<NotaResumoDTO[]> {
  const params = new URLSearchParams();
  if (filtros.status) params.append("status", filtros.status);
  if (filtros.tipo) params.append("tipo", filtros.tipo);
  if (filtros.remetenteId) params.append("remetenteId", filtros.remetenteId);
  if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio);
  if (filtros.dataFim) params.append("dataFim", filtros.dataFim);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}/notas${query}`, {
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
        `Erro ao listar notas (${res.status})`
    );
  }

  return res.json();
}

export async function buscarNotaPorId(id: string): Promise<NotaResponseDTO> {
  const res = await fetch(`${BASE_URL}/notas/${id}`, {
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
        `Erro ao buscar detalhes da nota (${res.status})`
    );
  }

  return res.json();
}

export async function listarEntradasDisponiveisNota(
  filtros: FiltrosEntradasDisponiveis = {}
): Promise<NotaEntradaDTO[]> {
  const params = new URLSearchParams();
  if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio);
  if (filtros.dataFim) params.append("dataFim", filtros.dataFim);
  if (filtros.produtoId) params.append("produtoId", filtros.produtoId);
  if (filtros.fornecedor) params.append("fornecedor", filtros.fornecedor);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}/notas/entradas-disponiveis${query}`, {
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
        `Erro ao listar entradas disponíveis (${res.status})`
    );
  }

  return res.json();
}

export async function registrarNota(
  dados: NotaRequestDTO
): Promise<NotaResponseDTO> {
  const res = await fetch(`${BASE_URL}/notas`, {
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
        `Erro ao registrar nota (${res.status})`
    );
  }

  return res.json();
}

export async function emitirNotaLocal(
  dados: NotaLocalRequestDTO
): Promise<NotaResponseDTO> {
  const res = await fetch(`${BASE_URL}/notas/locais`, {
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
        `Erro ao emitir nota local (${res.status})`
    );
  }

  return res.json();
}

export async function editarNotaPendente(
  id: string,
  dados: NotaRequestDTO
): Promise<NotaResponseDTO> {
  const res = await fetch(`${BASE_URL}/notas/${id}`, {
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
        `Erro ao editar nota (${res.status})`
    );
  }

  return res.json();
}

export async function validarNota(id: string): Promise<NotaResponseDTO> {
  const res = await fetch(`${BASE_URL}/notas/${id}/validar`, {
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
        `Erro ao validar nota (${res.status})`
    );
  }

  return res.json();
}

export async function cancelarNota(
  id: string,
  justificativa: string
): Promise<NotaResponseDTO> {
  const res = await fetch(`${BASE_URL}/notas/${id}/cancelar`, {
    method: "PATCH",
    headers: obterHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ justificativa }),
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao cancelar nota (${res.status})`
    );
  }

  return res.json();
}

const MAX_DOCUMENTO_BYTES = 5 * 1024 * 1024; // 5 MB
const TIPOS_DOCUMENTO_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export async function anexarDocumentoNota(
  id: string,
  arquivo: File
): Promise<NotaDocumentoResponseDTO> {
  if (
    arquivo.size > MAX_DOCUMENTO_BYTES ||
    !TIPOS_DOCUMENTO_PERMITIDOS.includes(arquivo.type)
  ) {
    throw new Error(
      "Documento inválido. Envie apenas arquivo PDF, JPEG ou PNG de até 5 MB."
    );
  }

  const formData = new FormData();
  formData.append("arquivo", arquivo);

  const res = await fetch(`${BASE_URL}/notas/${id}/documento`, {
    method: "POST",
    headers: obterHeaders(),
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao anexar documento da nota (${res.status})`
    );
  }

  return res.json();
}

export async function baixarDocumentoNota(
  id: string
): Promise<{ blob: Blob; contentType: string }> {
  const res = await fetch(`${BASE_URL}/notas/${id}/documento`, {
    headers: obterHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao baixar documento da nota (${res.status})`
    );
  }

  const contentType = res.headers.get("content-type") || "application/pdf";
  const blob = await res.blob();
  return { blob, contentType };
}
