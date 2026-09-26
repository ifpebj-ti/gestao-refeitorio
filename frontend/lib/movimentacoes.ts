const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface MovimentacaoEntradaRequest {
  produtoId: string;
  localId: string;
  quantidade: number;
  data: string; // YYYY-MM-DD
  origem: "EXTERNA" | "AGROINDUSTRIA" | "INTERNA";
  valor: number;
}

export interface MovimentacaoSaidaRequest {
  produtoId: string;
  localId: string;
  quantidade: number;
  data: string; // YYYY-MM-DD
  tipoSaida: "CONSUMO" | "PERDA" | "DESCARTE" | "OUTRO";
}

export interface MovimentacaoResponse {
  id: string;
  produtoId: string;
  produtoNome?: string;
  localId: string;
  localNome?: string;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: number;
  data: string;
  origem: "EXTERNA" | "AGROINDUSTRIA" | "INTERNA" | string;
  valor: number;
  tipoSaida?: "CONSUMO" | "PERDA" | "DESCARTE" | "OUTRO" | string;
  dataValidade?: string;
  saldoAtual?: number;
}

export const registrarEntradaApi = async (
  dados: MovimentacaoEntradaRequest,
  arquivoFoto?: File | null
): Promise<MovimentacaoResponse> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:token") : null;

  if (!token) {
    throw new Error("Token de autenticação não encontrado. Faça login na Área do Nutricionista.");
  }

  const url = `${BASE_URL}/movimentacoes/entrada`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(">>> Resposta de erro do backend:", res.status, errorText);
    throw new Error(`Erro na API (${res.status}): ${errorText || "Falha na requisição"}`);
  }

  const movimentacaoCriada: MovimentacaoResponse = await res.json();

  if (arquivoFoto && movimentacaoCriada?.id) {
    const formData = new FormData();
    formData.append("arquivo", arquivoFoto);
    await fetch(`${BASE_URL}/movimentacoes/${movimentacaoCriada.id}/foto`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  }

  return movimentacaoCriada;
};

export const registrarSaidaApi = async (
  dados: MovimentacaoSaidaRequest
): Promise<MovimentacaoResponse> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:token") : null;

  if (!token) {
    throw new Error("Token de autenticação não encontrado. Faça login na Área do Nutricionista.");
  }

  const url = `${BASE_URL}/movimentacoes/saida`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(">>> Resposta de erro do backend:", res.status, errorText);
    throw new Error(`Erro na API (${res.status}): ${errorText || "Falha na requisição"}`);
  }

  return await res.json();
};

export const listarHistoricoApi = async (): Promise<MovimentacaoResponse[]> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:token") : null;
  if (!token) throw new Error("Token de autenticação não encontrado.");

  const url = `${BASE_URL}/movimentacoes`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao buscar histórico (${res.status}): ${errorText || "Falha na requisição"}`);
  }

  return await res.json();
};