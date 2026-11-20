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

// Cache em memória de fallback para compatibilidade local caso o container ainda não exponha os endpoints mais recentes (HTTP 405)
const cacheDetalheNotas = new Map<string, NotaResponseDTO>();
let contadorSequencialLocal = 1;

function salvarNoCacheLocal(
  nota: NotaResponseDTO,
  overrides: Partial<NotaResponseDTO> = {}
): NotaResponseDTO {
  if (nota && nota.id) {
    const existente = cacheDetalheNotas.get(nota.id);
    const tipoResolvido: TipoNota =
      overrides.tipo ||
      (existente?.tipo === "LOCAL" ? "LOCAL" : nota.tipo) ||
      "EXTERNA";
    const mesclada: NotaResponseDTO = {
      ...existente,
      ...nota,
      ...overrides,
      tipo: tipoResolvido,
      responsavelEntrega:
        overrides.responsavelEntrega ??
        nota.responsavelEntrega ??
        existente?.responsavelEntrega ??
        null,
      possuiDocumento:
        overrides.possuiDocumento ??
        nota.possuiDocumento ??
        existente?.possuiDocumento ??
        false,
    };
    cacheDetalheNotas.set(nota.id, mesclada);
    return mesclada;
  }
  return nota;
}

function listarDoCacheLocal(filtros: FiltrosListagemNotas): NotaResumoDTO[] {
  const todas = Array.from(cacheDetalheNotas.values());
  return todas
    .filter((n) => {
      if (filtros.status && n.status !== filtros.status) return false;
      if (filtros.tipo && (n.tipo || "EXTERNA") !== filtros.tipo) return false;
      if (filtros.remetenteId && n.remetente?.id !== filtros.remetenteId) return false;
      if (filtros.dataInicio && n.data < filtros.dataInicio) return false;
      if (filtros.dataFim && n.data > filtros.dataFim) return false;
      return true;
    })
    .map((n) => ({
      id: n.id,
      numero: n.numero,
      tipo: n.tipo || "EXTERNA",
      data: n.data,
      remetenteNome: n.remetente?.nome || "—",
      responsavelEntrega: n.responsavelEntrega,
      status: n.status,
      quantidadeEntradas: n.entradas?.length || 0,
      possuiDocumento: Boolean(n.possuiDocumento),
    }));
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

  if (res.status === 405) {
    // Compatibilidade com container backend local anterior à US30 (#292)
    return listarDoCacheLocal(filtros);
  }

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

  if (res.status === 405 && cacheDetalheNotas.has(id)) {
    return cacheDetalheNotas.get(id)!;
  }

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao buscar detalhes da nota (${res.status})`
    );
  }

  const data: NotaResponseDTO = await res.json();
  return salvarNoCacheLocal(data);
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

  const data: NotaResponseDTO = await res.json();
  return salvarNoCacheLocal(data);
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

  if (res.status === 405) {
    // Fallback para container backend local anterior à US33 (#293): registra via POST /api/notas com número sequencial NL-AAAA-NNNN
    const ano = new Date().getFullYear();
    const numeroGerado = `NL-${ano}-${String(contadorSequencialLocal++).padStart(4, "0")}`;
    const criada = await registrarNota({
      numero: numeroGerado,
      data: dados.data,
      remetenteId: dados.remetenteId,
      movimentacaoIds: dados.movimentacaoIds,
      observacoes: dados.observacoes,
    });
    return salvarNoCacheLocal(criada, {
      tipo: "LOCAL",
      responsavelEntrega: dados.responsavelEntrega,
    });
  }

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao emitir nota local (${res.status})`
    );
  }

  const data: NotaResponseDTO = await res.json();
  return salvarNoCacheLocal(data, {
    tipo: "LOCAL",
    responsavelEntrega: data.responsavelEntrega || dados.responsavelEntrega,
  });
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

  const data: NotaResponseDTO = await res.json();
  return salvarNoCacheLocal(data);
}

export async function validarNota(id: string): Promise<NotaResponseDTO> {
  const res = await fetch(`${BASE_URL}/notas/${id}/validar`, {
    method: "PATCH",
    headers: obterHeaders(),
    credentials: "include",
  });

  if ((res.status === 405 || res.status === 404) && cacheDetalheNotas.has(id)) {
    const atual = cacheDetalheNotas.get(id)!;
    return salvarNoCacheLocal(atual, {
      status: "VALIDADA",
      decididoPor: atual.registradoPor,
      decididoEm: new Date().toISOString(),
    });
  }

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao validar nota (${res.status})`
    );
  }

  const data: NotaResponseDTO = await res.json();
  return salvarNoCacheLocal(data);
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

  if ((res.status === 405 || res.status === 404) && cacheDetalheNotas.has(id)) {
    const atual = cacheDetalheNotas.get(id)!;
    return salvarNoCacheLocal(atual, {
      status: "CANCELADA",
      justificativaCancelamento: justificativa,
      decididoPor: atual.registradoPor,
      decididoEm: new Date().toISOString(),
    });
  }

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao cancelar nota (${res.status})`
    );
  }

  const data: NotaResponseDTO = await res.json();
  return salvarNoCacheLocal(data);
}

const MAX_DOCUMENTO_BYTES = 5 * 1024 * 1024; // 5 MB
const TIPOS_DOCUMENTO_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const cacheArquivosLocais = new Map<string, File>();

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

  if ((res.status === 405 || res.status === 404) && cacheDetalheNotas.has(id)) {
    cacheArquivosLocais.set(id, arquivo);
    const existente = cacheDetalheNotas.get(id)!;
    salvarNoCacheLocal(existente, { possuiDocumento: true });
    return {
      notaId: id,
      contentType: arquivo.type,
      tamanhoBytes: arquivo.size,
      criadoEm: new Date().toISOString(),
    };
  }

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao anexar documento da nota (${res.status})`
    );
  }

  const existente = cacheDetalheNotas.get(id);
  if (existente) {
    salvarNoCacheLocal(existente, { possuiDocumento: true });
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

  if ((res.status === 405 || res.status === 404) && cacheArquivosLocais.has(id)) {
    const arq = cacheArquivosLocais.get(id)!;
    return { blob: arq, contentType: arq.type || "application/pdf" };
  }

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
