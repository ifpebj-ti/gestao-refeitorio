"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  Download,
  FileText,
  Utensils,
  DollarSign,
  Wallet,
  PieChart,
  BarChart2,
  ClockAlert,
  ArrowUpDown,
  Boxes,
  TrendingUp,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  CategoriaAlimento,
  obterEstoqueMinimoPorCategoria,
} from "@/app/utils/estoqueRules";
import {
  buscarRelatorioMensal,
  buscarGraficoConsumo,
  exportarRelatorioPdf,
  exportarRelatorioExcel,
  RelatorioMensalItemDTO,
  ConsumoDiarioDTO,
} from "@/lib/relatorios";

// ─── Helpers de data ──────────────────────────────────────────────────────────

function primeiroDiaDoMes(data: Date): string {
  return new Date(data.getFullYear(), data.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function ultimoDiaDoMes(data: Date): string {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

function hoje(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Dados estáticos para seções que ainda não têm endpoint de back ───────────
// (rotatividade e insumos parados são derivados visualmente do relatório mensal)

const CORES_CATEGORIA: Record<string, string> = {
  "Proteínas & Frios": "bg-emerald-600",
  "Grãos & Cereais": "bg-emerald-500",
  Hortifrúti: "bg-emerald-400",
  Laticínios: "bg-emerald-300",
  "Especificações & Condimentos": "bg-slate-300",
};

const CORES_STROKE: Record<string, string> = {
  "Proteínas & Frios": "#059669",
  "Grãos & Cereais": "#10b981",
  Hortifrúti: "#6ee7b7",
  Laticínios: "#a7f3d0",
  "Especificações & Condimentos": "#cbd5e1",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const router = useRouter();
  const { autenticado, carregando, perfil } = useAuth();

  // ── Filtro de período ──
  const agora = new Date();
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes(agora));
  const [dataFim, setDataFim] = useState(hoje());

  // ── Dados do backend ──
  const [relatorio, setRelatorio] = useState<RelatorioMensalItemDTO[]>([]);
  const [graficoConsumo, setGraficoConsumo] = useState<ConsumoDiarioDTO[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ── Interações visuais ──
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [insumoAtivo, setInsumoAtivo] = useState<string | null>(null);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  useEffect(() => {
    if (!carregando) {
      if (!autenticado) {
        router.push("/");
      } else if (perfil === "ADMIN") {
        router.push("/usuarios");
      }
    }
  }, [autenticado, carregando, perfil, router]);

  const carregarDados = useCallback(async () => {
    if (!autenticado) return;
    setCarregandoDados(true);
    setErro(null);
    try {
      const [rel, grafico] = await Promise.all([
        buscarRelatorioMensal(dataInicio, dataFim),
        buscarGraficoConsumo(dataInicio, dataFim),
      ]);
      setRelatorio(rel);
      setGraficoConsumo(grafico);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados.");
    } finally {
      setCarregandoDados(false);
    }
  }, [autenticado, dataInicio, dataFim]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (carregando || !autenticado) return null;

  // ── KPIs calculados a partir do relatório real ──
  const totalGasto = relatorio.reduce(
    (acc, item) => acc + Number(item.valorEntradas),
    0
  );
  const totalSaidas = relatorio.reduce(
    (acc, item) => acc + Number(item.quantidadeSaidas),
    0
  );
  const itensComMovimento = relatorio.filter(
    (i) => Number(i.quantidadeSaidas) > 0
  ).length;

  // Dias no período para projeção
  const diasPeriodo = Math.max(
    1,
    Math.ceil(
      (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const diasNoMes = 30;
  const projecaoMes = diasPeriodo < diasNoMes
    ? (totalGasto / diasPeriodo) * diasNoMes
    : totalGasto;

  // Agrupamento por categoria para a barra de distribuição
  const porCategoria = relatorio.reduce<
    Record<string, { totalSaidas: number; totalValor: number }>
  >((acc, item) => {
    // Tenta mapear produto para categoria (não vem no DTO; agrupamos por substring do nome como fallback)
    const cat = detectarCategoria(item.produtoNome);
    if (!acc[cat]) acc[cat] = { totalSaidas: 0, totalValor: 0 };
    acc[cat].totalSaidas += Number(item.quantidadeSaidas);
    acc[cat].totalValor += Number(item.valorEntradas);
    return acc;
  }, {});

  const categoriasOrdenadas = Object.entries(porCategoria)
    .map(([cat, dados]) => ({
      categoria: cat,
      totalKg: dados.totalSaidas,
      custoTotal: dados.totalValor,
      porcentagem:
        totalGasto > 0 ? Math.round((dados.totalValor / totalGasto) * 100) : 0,
      cor: CORES_CATEGORIA[cat] ?? "bg-slate-400",
      corStroke: CORES_STROKE[cat] ?? "#94a3b8",
    }))
    .sort((a, b) => b.custoTotal - a.custoTotal);

  // Top 5 insumos por valor
  const topInsumos = [...relatorio]
    .sort((a, b) => Number(b.valorEntradas) - Number(a.valorEntradas))
    .slice(0, 5);
  const maxValorInsumo = topInsumos[0]
    ? Number(topInsumos[0].valorEntradas)
    : 1;

  // Gráfico de consumo: normalização para barra de progresso visual
  const maxConsumo = graficoConsumo.reduce(
    (max, p) => Math.max(max, Number(p.quantidade)),
    1
  );

  // Donut SVG
  const C = 100.53;
  let offsetAcumulado = 0;
  const itemFornecedorFoco = categoriasOrdenadas.find(
    (f) => f.categoria === categoriaAtiva
  );

  const handleExportarPdf = async () => {
    setExportandoPdf(true);
    try {
      await exportarRelatorioPdf(dataInicio, dataFim);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao exportar PDF.");
    } finally {
      setExportandoPdf(false);
    }
  };

  const handleExportarExcel = async () => {
    setExportandoExcel(true);
    try {
      await exportarRelatorioExcel(dataInicio, dataFim);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao exportar Excel.");
    } finally {
      setExportandoExcel(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">

      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Relatórios & Indicadores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Métricas de insumos, gráfico de consumo e exportação de relatórios
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-auto">
          {/* Seletor de período real */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <span className="text-slate-400">De</span>
            <input
              id="data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border-none outline-none text-xs font-semibold text-slate-800 bg-transparent cursor-pointer"
            />
            <span className="text-slate-400">até</span>
            <input
              id="data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border-none outline-none text-xs font-semibold text-slate-800 bg-transparent cursor-pointer"
            />
          </div>

          {/* Exportar PDF */}
          <button
            id="btn-exportar-pdf"
            type="button"
            onClick={handleExportarPdf}
            disabled={exportandoPdf || relatorio.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Exportar relatório em PDF"
          >
            {exportandoPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Exportar Excel */}
          <button
            id="btn-exportar-excel"
            type="button"
            onClick={handleExportarExcel}
            disabled={exportandoExcel || relatorio.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Exportar relatório em Excel"
          >
            {exportandoExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* ERRO */}
      {erro && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* LOADING */}
      {carregandoDados && (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-400 font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Carregando dados do período...</span>
        </div>
      )}

      {!carregandoDados && (
        <>
          {/* 2. CARDS DE KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Gasto Realizado</span>
              </span>
              <p className="text-2xl font-black text-slate-800">
                R${" "}
                {totalGasto.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-[11px] text-slate-400">
                Entradas no período selecionado
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>Projeção Mensal</span>
              </span>
              <p className="text-2xl font-black text-slate-900">
                R${" "}
                {projecaoMes.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Estimativa de empenho
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>Volume Total Baixado</span>
              </span>
              <p className="text-2xl font-black text-slate-800">
                {totalSaidas.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}{" "}
                <span className="text-sm font-semibold text-slate-400">
                  Kg/Lt
                </span>
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Média de ~
                {(totalSaidas / diasPeriodo).toFixed(1)} Kg/dia
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" />
                <span>Itens em Movimentação</span>
              </span>
              <p className="text-2xl font-black text-slate-800">
                {itensComMovimento}{" "}
                <span className="text-sm font-semibold text-slate-400">
                  / {relatorio.length}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                {relatorio.length - itensComMovimento} itens sem saída no
                período
              </p>
            </div>
          </div>

          {/* 3. DISTRIBUIÇÃO POR GRUPO DE ALIMENTOS */}
          {categoriasOrdenadas.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Composição de Gastos por Grupo de Alimentos
                  </h2>
                  <p className="text-xs text-slate-400">
                    Passe o mouse sobre as faixas ou itens para inspecionar os
                    valores
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100/70 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  Total: R${" "}
                  {totalGasto.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-visible gap-1 py-0.5 px-0.5">
                {categoriasOrdenadas.map((item) => {
                  const isFocado = categoriaAtiva === item.categoria;
                  const algumFocado = categoriaAtiva !== null;
                  return (
                    <div
                      key={item.categoria}
                      onMouseEnter={() => setCategoriaAtiva(item.categoria)}
                      onMouseLeave={() => setCategoriaAtiva(null)}
                      onClick={() =>
                        setCategoriaAtiva((prev) =>
                          prev === item.categoria ? null : item.categoria
                        )
                      }
                      style={{ width: `${item.porcentagem}%` }}
                      className={`h-full rounded-full transition-all duration-300 cursor-pointer ${item.cor} ${
                        isFocado
                          ? "scale-y-125 -translate-y-0.5 shadow-xs z-10 brightness-105"
                          : algumFocado
                          ? "opacity-40"
                          : "opacity-100"
                      }`}
                      title={`${item.categoria}: ${item.porcentagem}% (R$ ${item.custoTotal.toLocaleString("pt-BR")})`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {categoriasOrdenadas.map((item) => {
                  const isFocado = categoriaAtiva === item.categoria;
                  const algumFocado = categoriaAtiva !== null;
                  return (
                    <div
                      key={item.categoria}
                      onMouseEnter={() => setCategoriaAtiva(item.categoria)}
                      onMouseLeave={() => setCategoriaAtiva(null)}
                      onClick={() =>
                        setCategoriaAtiva((prev) =>
                          prev === item.categoria ? null : item.categoria
                        )
                      }
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isFocado
                          ? "border-emerald-500 bg-emerald-50/40 shadow-xs -translate-y-0.5"
                          : algumFocado
                          ? "border-slate-100 bg-slate-50/20 opacity-50"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 transition-transform ${item.cor} ${isFocado ? "scale-125" : ""}`}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {item.categoria}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.totalKg.toLocaleString("pt-BR", {
                              maximumFractionDigits: 1,
                            })}{" "}
                            Kg/Lt
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-800 block">
                          R${" "}
                          {item.custoTotal.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.porcentagem}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. DONUT + BARRAS DE IMPACTO FINANCEIRO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* DONUT INTERATIVO POR CATEGORIA */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>Distribuição de Gastos por Categoria</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Passe o mouse no anel para inspecionar cada grupo
                  </p>
                </div>
                {categoriaAtiva && (
                  <button
                    type="button"
                    onClick={() => setCategoriaAtiva(null)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 underline cursor-pointer"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="3.5" />
                    {categoriasOrdenadas.map((item) => {
                      const dashLength = (item.porcentagem * C) / 100;
                      const currentOffset = offsetAcumulado;
                      offsetAcumulado += dashLength;
                      const isFocado = categoriaAtiva === item.categoria;
                      const algumFocado = categoriaAtiva !== null;
                      return (
                        <circle
                          key={item.categoria}
                          cx="18" cy="18" r="16"
                          fill="transparent"
                          stroke={item.corStroke}
                          strokeWidth={isFocado ? "5.5" : "4"}
                          strokeDasharray={`${dashLength} ${C}`}
                          strokeDashoffset={-currentOffset}
                          onMouseEnter={() => setCategoriaAtiva(item.categoria)}
                          onMouseLeave={() => setCategoriaAtiva(null)}
                          onClick={() =>
                            setCategoriaAtiva((prev) =>
                              prev === item.categoria ? null : item.categoria
                            )
                          }
                          className="cursor-pointer transition-all duration-300"
                          style={{
                            opacity: isFocado ? 1 : algumFocado ? 0.35 : 1,
                            filter: isFocado ? "drop-shadow(0 2px 4px rgba(0,0,0,0.12))" : "none",
                          }}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                    {itemFornecedorFoco ? (
                      <>
                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[85px]">
                          {itemFornecedorFoco.categoria}
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {itemFornecedorFoco.porcentagem}%
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-800">
                          R$ {itemFornecedorFoco.custoTotal.toLocaleString("pt-BR")}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                        <span className="text-sm font-black text-slate-800">100%</span>
                        <span className="text-[9px] text-slate-400">{categoriasOrdenadas.length} grupos</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full space-y-2">
                  {categoriasOrdenadas.map((item) => {
                    const isFocado = categoriaAtiva === item.categoria;
                    const algumFocado = categoriaAtiva !== null;
                    return (
                      <div
                        key={item.categoria}
                        onMouseEnter={() => setCategoriaAtiva(item.categoria)}
                        onMouseLeave={() => setCategoriaAtiva(null)}
                        onClick={() =>
                          setCategoriaAtiva((prev) =>
                            prev === item.categoria ? null : item.categoria
                          )
                        }
                        className={`flex items-center justify-between text-xs p-2 rounded-xl transition-all cursor-pointer ${
                          isFocado
                            ? "bg-slate-100 font-bold scale-[1.02]"
                            : algumFocado
                            ? "opacity-40"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                            style={{
                              backgroundColor: item.corStroke,
                              transform: isFocado ? "scale(1.3)" : "scale(1)",
                            }}
                          />
                          <span className="text-slate-700 truncate">{item.categoria}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-800">
                            R$ {item.custoTotal.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({item.porcentagem}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BARRAS DE IMPACTO FINANCEIRO — Top 5 insumos reais */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <span>Insumos de Maior Impacto Financeiro</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Top 5 insumos por valor de entradas no período
                </p>
              </div>

              {topInsumos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Nenhuma movimentação no período selecionado.
                </p>
              ) : (
                <div className="space-y-3 pt-1">
                  {topInsumos.map((insumo) => {
                    const isFocado = insumoAtivo === insumo.produtoNome;
                    const algumFocado = insumoAtivo !== null;
                    const pct = Math.round(
                      (Number(insumo.valorEntradas) / maxValorInsumo) * 100
                    );

                    return (
                      <div
                        key={insumo.produtoId}
                        onMouseEnter={() => setInsumoAtivo(insumo.produtoNome)}
                        onMouseLeave={() => setInsumoAtivo(null)}
                        onClick={() =>
                          setInsumoAtivo((prev) =>
                            prev === insumo.produtoNome ? null : insumo.produtoNome
                          )
                        }
                        className={`space-y-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                          isFocado
                            ? "bg-slate-50 shadow-2xs scale-[1.01]"
                            : algumFocado
                            ? "opacity-45"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold text-slate-800 ${isFocado ? "text-emerald-800 font-bold" : ""}`}>
                            {insumo.produtoNome}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">
                              {Number(insumo.quantidadeSaidas).toFixed(1)} Kg/Lt consumidos
                            </span>
                            <span className="font-bold text-slate-900">
                              R$ {Number(insumo.valorEntradas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFocado
                                ? "bg-emerald-600 scale-y-125 brightness-110"
                                : "bg-emerald-600/80"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 5. GRÁFICO DE CONSUMO POR PERÍODO (US21) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Consumo Diário por Período</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Quantidade total baixada por dia no intervalo selecionado
              </p>
            </div>

            {graficoConsumo.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhum dado de consumo para o período selecionado.
              </p>
            ) : (
              <div className="space-y-2">
                {graficoConsumo.map((ponto) => {
                  const pct = Math.round(
                    (Number(ponto.quantidade) / maxConsumo) * 100
                  );
                  const dataFormatada = new Date(ponto.data + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  });
                  return (
                    <div key={ponto.data} className="flex items-center gap-3 text-xs">
                      <span className="w-10 text-right text-slate-400 shrink-0 font-medium">
                        {dataFormatada}
                      </span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        />
                      </div>
                      <span className="w-16 text-right font-bold text-slate-800 shrink-0">
                        {Number(ponto.quantidade).toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                        })}{" "}
                        <span className="text-[10px] font-normal text-slate-400">Kg</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. TABELA CONSOLIDADA — Relatório Mensal (US19) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Relatório Consolidado de Estoque
              </h3>
              <span className="ml-auto text-[11px] text-slate-400">
                {relatorio.length} produtos
              </span>
            </div>

            {relatorio.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Nenhum produto com movimentação no período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-right">Entradas</th>
                      <th className="px-4 py-3 text-right">Saídas</th>
                      <th className="px-4 py-3 text-right">Prod. Interna</th>
                      <th className="px-4 py-3 text-right">Valor Entradas</th>
                      <th className="px-4 py-3 text-right">Saldo Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {relatorio.map((item) => (
                      <tr
                        key={item.produtoId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.produtoNome}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700 font-bold">
                          +{Number(item.quantidadeEntradas).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-600 font-bold">
                          -{Number(item.quantidadeSaidas).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {Number(item.quantidadeProducaoInterna) > 0
                            ? `+${Number(item.quantidadeProducaoInterna).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          R$ {Number(item.valorEntradas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right font-extrabold ${Number(item.saldoFinal) < 0 ? "text-rose-700" : "text-slate-900"}`}>
                          {Number(item.saldoFinal).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 7. AUDITORIA DE ROTATIVIDADE & INSUMOS SEM SAÍDA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Rotatividade baseada no relatório real */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <ArrowUpDown className="w-4 h-4 text-emerald-600" />
                  <span>Auditoria de Rotatividade de Insumos</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Classificação ABC baseada nas saídas do período
                </p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {[...relatorio]
                  .sort((a, b) => Number(b.quantidadeSaidas) - Number(a.quantidadeSaidas))
                  .slice(0, 6)
                  .map((item) => {
                    const saidas = Number(item.quantidadeSaidas);
                    const maxSaidas = Number(relatorio[0]?.quantidadeSaidas ?? 1);
                    const pct = saidas / maxSaidas;
                    const classificacao =
                      pct >= 0.6
                        ? "Classe A (Alto Giro)"
                        : pct >= 0.2
                        ? "Classe B (Giro Médio)"
                        : "Classe C (Baixo Giro)";
                    const corClasse =
                      pct >= 0.6
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : pct >= 0.2
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-50 text-amber-800 border border-amber-200";

                    return (
                      <div
                        key={item.produtoId}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {item.produtoNome}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {saidas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} Kg/Lt baixados
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${corClasse}`}>
                          {classificacao}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Insumos sem saída no período */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <ClockAlert className="w-4 h-4 text-amber-600" />
                  <span>Insumos sem Saída no Período</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Itens com saldo positivo e sem baixas registradas
                </p>
              </div>

              {relatorio.filter((i) => Number(i.quantidadeSaidas) === 0 && Number(i.saldoFinal) > 0).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Todos os itens tiveram movimentação no período.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {relatorio
                    .filter((i) => Number(i.quantidadeSaidas) === 0 && Number(i.saldoFinal) > 0)
                    .map((item) => (
                      <div
                        key={item.produtoId}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{item.produtoNome}</p>
                          <p className="text-[11px] text-slate-400">
                            Saldo: {Number(item.saldoFinal).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} Kg/Lt
                          </p>
                        </div>
                        <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          Sem saída
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <p className="text-[11px] text-slate-400 pt-1">
                Sugestão: alocar esses insumos nos próximos cardápios para evitar vencimento.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Detectar categoria pelo nome do produto (fallback enquanto o back não retorna a categoria no relatório) ──

function detectarCategoria(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("frango") || n.includes("carne") || n.includes("peixe") || n.includes("ovo") || n.includes("peito") || n.includes("coxa") || n.includes("file") || n.includes("filé"))
    return "Proteínas & Frios";
  if (n.includes("arroz") || n.includes("feij") || n.includes("milho") || n.includes("trigo") || n.includes("aveia") || n.includes("macarrão") || n.includes("macarrao") || n.includes("farin"))
    return "Grãos & Cereais";
  if (n.includes("leite") || n.includes("queij") || n.includes("iogurt") || n.includes("manteig") || n.includes("nata"))
    return "Laticínios";
  if (n.includes("tomate") || n.includes("alface") || n.includes("cenoura") || n.includes("couve") || n.includes("cebola") || n.includes("alho") || n.includes("beterraba") || n.includes("chuchu"))
    return "Hortifrúti";
  return "Especificações & Condimentos";
}
