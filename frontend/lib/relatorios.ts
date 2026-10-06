import {
  STORAGE_TOKEN_KEY,
  isTokenExpirado,
  limparSessaoLocal,
  notificarSessaoExpirada,
  tratarSessaoExpiradaSe401,
} from "./authSession";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ─── DTOs espelhando o backend ────────────────────────────────────────────────

export interface RelatorioMensalItemDTO {
  produtoId: string;
  produtoNome: string;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
  quantidadeProducaoInterna: number;
  valorEntradas: number;
  saldoFinal: number;
}

export interface ConsumoDiarioDTO {
  data: string; // "YYYY-MM-DD"
  quantidade: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_TOKEN_KEY)
      : null;
  if (!token || isTokenExpirado(token)) {
    limparSessaoLocal();
    notificarSessaoExpirada();
    throw new Error(
      "Sessão expirada. Faça login na Área do Nutricionista."
    );
  }
  return token;
}

// ─── Relatório mensal consolidado (US19 / #160) ───────────────────────────────

export async function buscarRelatorioMensal(
  dataInicio: string,
  dataFim: string
): Promise<RelatorioMensalItemDTO[]> {
  const token = getToken();
  const res = await fetch(
    `${BASE_URL}/relatorios/mensal?dataInicio=${dataInicio}&dataFim=${dataFim}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const txt = await res.text();
    throw new Error(`Erro ao buscar relatório (${res.status}): ${txt}`);
  }
  return res.json();
}

// ─── Exportar PDF (US20 / #163) ───────────────────────────────────────────────

export async function exportarRelatorioPdf(
  dataInicio: string,
  dataFim: string
): Promise<void> {
  const token = getToken();
  const res = await fetch(
    `${BASE_URL}/relatorios/mensal/pdf?dataInicio=${dataInicio}&dataFim=${dataFim}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    throw new Error(`Erro ao exportar PDF (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-mensal-${dataInicio}-a-${dataFim}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Exportar Excel (US20 / #163) ─────────────────────────────────────────────

export async function exportarRelatorioExcel(
  dataInicio: string,
  dataFim: string
): Promise<void> {
  const token = getToken();
  const res = await fetch(
    `${BASE_URL}/relatorios/mensal/excel?dataInicio=${dataInicio}&dataFim=${dataFim}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    throw new Error(`Erro ao exportar Excel (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-mensal-${dataInicio}-a-${dataFim}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Gráfico de consumo por período (US21 / #166) ────────────────────────────

export async function buscarGraficoConsumo(
  dataInicio: string,
  dataFim: string,
  produtoId?: string
): Promise<ConsumoDiarioDTO[]> {
  const token = getToken();
  const params = new URLSearchParams({ dataInicio, dataFim });
  if (produtoId) params.append("produtoId", produtoId);
  const res = await fetch(`${BASE_URL}/relatorios/consumo?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const txt = await res.text();
    throw new Error(`Erro ao buscar gráfico (${res.status}): ${txt}`);
  }
  return res.json();
}
