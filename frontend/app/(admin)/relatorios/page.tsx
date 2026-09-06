"use client";

import { useState } from "react";
import {
  Download,
  Utensils,
  DollarSign,
  Wallet,
  PieChart,
  BarChart2,
  ClockAlert,
  ArrowUpDown,
  Boxes,
} from "lucide-react";

type PeriodoFiltro = "semana" | "mes" | "anterior";

interface ConsumoCategoria {
  categoria: string;
  totalKg: number;
  custoTotal: number;
  porcentagem: number;
  cor: string;
}

interface ItemRotatividade {
  nome: string;
  classificacaoABC: "Classe A (Alto Giro)" | "Classe B (Giro Médio)" | "Classe C (Baixo Giro / Parado)";
  saldoAtual: string;
  frequenciaSaida: string;
  statusGiro: "Giro Rápido" | "Estável" | "Sem Saída";
}

const CATEGORIAS_CONSUMO_MOCK: Record<PeriodoFiltro, ConsumoCategoria[]> = {
  semana: [
    { categoria: "Proteínas & Frios", totalKg: 215, custoTotal: 4300.0, porcentagem: 48, cor: "bg-emerald-600" },
    { categoria: "Grãos & Cereais", totalKg: 185, custoTotal: 1665.0, porcentagem: 19, cor: "bg-emerald-500/80" },
    { categoria: "Hortifrúti", totalKg: 105, custoTotal: 945.0, porcentagem: 11, cor: "bg-emerald-400/80" },
    { categoria: "Laticínios", totalKg: 42, custoTotal: 1344.0, porcentagem: 15, cor: "bg-emerald-300/80" },
    { categoria: "Especificações & Condimentos", totalKg: 22, custoTotal: 616.0, porcentagem: 7, cor: "bg-slate-300" },
  ],
  mes: [
    { categoria: "Proteínas & Frios", totalKg: 920, custoTotal: 18400.0, porcentagem: 49, cor: "bg-emerald-600" },
    { categoria: "Grãos & Cereais", totalKg: 780, custoTotal: 7020.0, porcentagem: 19, cor: "bg-emerald-500/80" },
    { categoria: "Hortifrúti", totalKg: 430, custoTotal: 3870.0, porcentagem: 10, cor: "bg-emerald-400/80" },
    { categoria: "Laticínios", totalKg: 165, custoTotal: 5280.0, porcentagem: 14, cor: "bg-emerald-300/80" },
    { categoria: "Especificações & Condimentos", totalKg: 85, custoTotal: 2380.0, porcentagem: 6, cor: "bg-slate-300" },
  ],
  anterior: [
    { categoria: "Proteínas & Frios", totalKg: 890, custoTotal: 17800.0, porcentagem: 49, cor: "bg-emerald-600" },
    { categoria: "Grãos & Cereais", totalKg: 810, custoTotal: 7290.0, porcentagem: 20, cor: "bg-emerald-500/80" },
    { categoria: "Hortifrúti", totalKg: 395, custoTotal: 3555.0, porcentagem: 10, cor: "bg-emerald-400/80" },
    { categoria: "Laticínios", totalKg: 150, custoTotal: 4800.0, porcentagem: 13, cor: "bg-emerald-300/80" },
    { categoria: "Especificações & Condimentos", totalKg: 90, custoTotal: 2520.0, porcentagem: 7, cor: "bg-slate-300" },
  ],
};

const TOP_INSUMOS_MOCK = [
  { nome: "Coxa de Frango", valor: 2520, valorFormatado: "R$ 2.520", porcentagemGasto: 100, detalhe: "180 Kg consumidos" },
  { nome: "Arroz Parboilizado", valor: 797.5, valorFormatado: "R$ 797", porcentagemGasto: 32, detalhe: "145 Kg consumidos" },
  { nome: "Feijão Macassar", valor: 665, valorFormatado: "R$ 665", porcentagemGasto: 26, detalhe: "95 Kg consumidos" },
  { nome: "Leite in natura", valor: 540, valorFormatado: "R$ 540", porcentagemGasto: 21, detalhe: "120 Lt consumidos" },
  { nome: "Ovos Pasteurizados", valor: 486, valorFormatado: "R$ 486", porcentagemGasto: 19, detalhe: "540 Und consumidas" },
];

const PREVISAO_FORNECEDORES_MOCK = [
  { fornecedor: "Avícola Regional", valor: 18400, porcentagem: 50, corStroke: "#059669" },
  { fornecedor: "Distribuidora Agreste", valor: 9400, porcentagem: 25, corStroke: "#10b981" },
  { fornecedor: "Coop. Vale do Ipojuca", valor: 6220, porcentagem: 17, corStroke: "#6ee7b7" },
  { fornecedor: "Feirante Local", valor: 2930, porcentagem: 8, corStroke: "#cbd5e1" },
];

// Curva de Rotatividade baseada estritamente nas baixas da cozinha
const ITENS_ROTATIVIDADE_MOCK: ItemRotatividade[] = [
  {
    nome: "Coxa & Peito de Frango",
    classificacaoABC: "Classe A (Alto Giro)",
    saldoAtual: "67 Kg",
    frequenciaSaida: "Baixas a cada 1 ou 2 dias",
    statusGiro: "Giro Rápido",
  },
  {
    nome: "Arroz e Feijão (Carioca/Macassar)",
    classificacaoABC: "Classe A (Alto Giro)",
    saldoAtual: "100 Kg",
    frequenciaSaida: "Saídas contínuas diárias",
    statusGiro: "Giro Rápido",
  },
  {
    nome: "Hortifrúti Fresco (Tomate/Couve)",
    classificacaoABC: "Classe B (Giro Médio)",
    saldoAtual: "20 Kg",
    frequenciaSaida: "Baixas 3x por semana",
    statusGiro: "Estável",
  },
  {
    nome: "Amido de Milho",
    classificacaoABC: "Classe C (Baixo Giro / Parado)",
    saldoAtual: "14 Kg",
    frequenciaSaida: "Sem saídas há 26 dias",
    statusGiro: "Sem Saída",
  },
  {
    nome: "Azeitona em Conserva",
    classificacaoABC: "Classe C (Baixo Giro / Parado)",
    saldoAtual: "10 Kg",
    frequenciaSaida: "Sem saídas há 21 dias",
    statusGiro: "Sem Saída",
  },
];

const ITENS_SEM_GIRO_MOCK = [
  { nome: "Amido de Milho", saldo: "14 Kg", diasParado: 26, local: "Despensa Seca" },
  { nome: "Azeitona em Conserva", saldo: "10 Kg", diasParado: 21, local: "Despensa Seca" },
  { nome: "Molho Shoyu", saldo: "5 Lt", diasParado: 19, local: "Despensa Seca" },
];

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("semana");

  const [fornecedorAtivo, setFornecedorAtivo] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [insumoAtivo, setInsumoAtivo] = useState<string | null>(null);

  const dadosCategorias = CATEGORIAS_CONSUMO_MOCK[periodo];
  const totalVolumeKg = dadosCategorias.reduce((acc, cur) => acc + cur.totalKg, 0);
  const totalCustoFinanceiro = dadosCategorias.reduce((acc, cur) => acc + cur.custoTotal, 0);

  const projecaoFechamentoMes = periodo === "semana" ? totalCustoFinanceiro * 4.2 : 36950.0;
  const C = 100.53;
  let offsetAcumulado = 0;

  const itemFornecedorFoco = PREVISAO_FORNECEDORES_MOCK.find(
    (f) => f.fornecedor === fornecedorAtivo
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Relatórios & Indicadores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Métricas de insumos, auditoria de rotatividade de estoque e previsão financeira
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPeriodo("semana")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periodo === "semana"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => setPeriodo("mes")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periodo === "mes"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Este Mês
            </button>
            <button
              type="button"
              onClick={() => setPeriodo("anterior")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periodo === "anterior"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mês Anterior
            </button>
          </div>

          <button
            type="button"
            onClick={() => alert("Relatório de estoque exportado com sucesso (.csv).")}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Exportar dados do período"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE KPIS MACRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Gasto Realizado</span>
          </span>
          <p className="text-2xl font-black text-slate-800">
            R$ {totalCustoFinanceiro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400">
            {periodo === "semana" ? "Insumos desta semana" : "Insumos acumulados"}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            <span>Projeção Fim de Mês</span>
          </span>
          <p className="text-2xl font-black text-slate-900">
            R$ {projecaoFechamentoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Estimativa de empenho
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-slate-400" />
            <span>Volume Total Baixado</span>
          </span>
          <p className="text-2xl font-black text-slate-800">
            {totalVolumeKg} <span className="text-sm font-semibold text-slate-400">Kg/Lt</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-medium">
            Média de ~{(totalVolumeKg / 5).toFixed(0)} Kg/dia útil
          </p>
        </div>

        {/* AJUSTADO: REFLETE O UNIVERSO DOS 58 INSUMOS CATALOGADOS */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
            <span>Itens em Movimentação</span>
          </span>
          <p className="text-2xl font-black text-slate-800">
            46 <span className="text-sm font-semibold text-slate-400">/ 58</span>
          </p>
          <p className="text-[11px] text-slate-500">
            12 itens sem saída recente
          </p>
        </div>
      </div>

      {/* 3. DISTRIBUIÇÃO POR GRUPO DE ALIMENTOS COM INTERAÇÃO */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Composição de Gastos por Grupo de Alimentos
            </h2>
            <p className="text-xs text-slate-400">
              Passe o mouse sobre as faixas ou itens para inspecionar os valores
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100/70 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Total: R$ {totalCustoFinanceiro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-visible gap-1 py-0.5 px-0.5">
          {dadosCategorias.map((item) => {
            const isFocado = categoriaAtiva === item.categoria;
            const algumFocado = categoriaAtiva !== null;

            return (
              <div
                key={item.categoria}
                onMouseEnter={() => setCategoriaAtiva(item.categoria)}
                onMouseLeave={() => setCategoriaAtiva(null)}
                onClick={() =>
                  setCategoriaAtiva((prev) => (prev === item.categoria ? null : item.categoria))
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
          {dadosCategorias.map((item) => {
            const isFocado = categoriaAtiva === item.categoria;
            const algumFocado = categoriaAtiva !== null;

            return (
              <div
                key={item.categoria}
                onMouseEnter={() => setCategoriaAtiva(item.categoria)}
                onMouseLeave={() => setCategoriaAtiva(null)}
                onClick={() =>
                  setCategoriaAtiva((prev) => (prev === item.categoria ? null : item.categoria))
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
                    className={`w-3 h-3 rounded-full shrink-0 transition-transform ${item.cor} ${
                      isFocado ? "scale-125" : ""
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {item.categoria}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.totalKg} Kg/Lt
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-800 block">
                    R$ {item.custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

      {/* 4. GRÁFICOS VISUAIS: DONUT + BARRAS PROGRESSIVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* DONUT INTERATIVO DE FATURAS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>Previsão de Faturas por Fornecedor</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Passe o mouse no anel para inspecionar cada contrato
              </p>
            </div>
            {fornecedorAtivo && (
              <button
                type="button"
                onClick={() => setFornecedorAtivo(null)}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 underline cursor-pointer"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="3.5"
                />

                {PREVISAO_FORNECEDORES_MOCK.map((item) => {
                  const dashLength = (item.porcentagem * C) / 100;
                  const currentOffset = offsetAcumulado;
                  offsetAcumulado += dashLength;

                  const isFocado = fornecedorAtivo === item.fornecedor;
                  const algumFocado = fornecedorAtivo !== null;

                  return (
                    <circle
                      key={item.fornecedor}
                      cx="18"
                      cy="18"
                      r="16"
                      fill="transparent"
                      stroke={item.corStroke}
                      strokeWidth={isFocado ? "5.5" : "4"}
                      strokeDasharray={`${dashLength} ${C}`}
                      strokeDashoffset={-currentOffset}
                      onMouseEnter={() => setFornecedorAtivo(item.fornecedor)}
                      onMouseLeave={() => setFornecedorAtivo(null)}
                      onClick={() =>
                        setFornecedorAtivo((prev) =>
                          prev === item.fornecedor ? null : item.fornecedor
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
                      {itemFornecedorFoco.fornecedor}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {itemFornecedorFoco.porcentagem}%
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-800">
                      R$ {itemFornecedorFoco.valor.toLocaleString("pt-BR")}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Faturas</span>
                    <span className="text-sm font-black text-slate-800">100%</span>
                    <span className="text-[9px] text-slate-400">4 fornecedores</span>
                  </>
                )}
              </div>
            </div>

            <div className="w-full space-y-2">
              {PREVISAO_FORNECEDORES_MOCK.map((item) => {
                const isFocado = fornecedorAtivo === item.fornecedor;
                const algumFocado = fornecedorAtivo !== null;

                return (
                  <div
                    key={item.fornecedor}
                    onMouseEnter={() => setFornecedorAtivo(item.fornecedor)}
                    onMouseLeave={() => setFornecedorAtivo(null)}
                    onClick={() =>
                      setFornecedorAtivo((prev) =>
                        prev === item.fornecedor ? null : item.fornecedor
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
                      <span className="text-slate-700 truncate">{item.fornecedor}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-800">
                        R$ {item.valor.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({item.porcentagem}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BARRAS DE IMPACTO FINANCEIRO */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                <span>Insumos de Maior Impacto Financeiro</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Passe o mouse para destacar a proporção de cada insumo
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {TOP_INSUMOS_MOCK.map((insumo) => {
              const isFocado = insumoAtivo === insumo.nome;
              const algumFocado = insumoAtivo !== null;

              return (
                <div
                  key={insumo.nome}
                  onMouseEnter={() => setInsumoAtivo(insumo.nome)}
                  onMouseLeave={() => setInsumoAtivo(null)}
                  onClick={() =>
                    setInsumoAtivo((prev) => (prev === insumo.nome ? null : insumo.nome))
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
                      {insumo.nome}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{insumo.detalhe}</span>
                      <span className="font-bold text-slate-900">{insumo.valorFormatado}</span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${insumo.porcentagemGasto}%` }}
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
        </div>
      </div>

      {/* 5. GESTÃO DE ESTOQUE: AUDITORIA DE ROTATIVIDADE & ITENS SEM SAÍDA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Curva de Rotatividade dos Alimentos */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4 text-emerald-600" />
                <span>Auditoria de Rotatividade de Insumos</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Classificação baseada no histórico de saídas registradas pela cozinha
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {ITENS_ROTATIVIDADE_MOCK.map((item) => (
              <div key={item.nome} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 truncate">{item.nome}</p>
                    <span className="text-[10px] text-slate-400 font-normal">({item.saldoAtual})</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.frequenciaSaida}</p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.statusGiro === "Giro Rápido"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.statusGiro === "Estável"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {item.classificacaoABC}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insumos Parados / Sem Movimentação */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ClockAlert className="w-4 h-4 text-amber-600" />
                <span>Insumos Parados (Risco de Vencimento)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Itens com saldo em estoque sem nenhuma baixa registrada há mais de 15 dias
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {ITENS_SEM_GIRO_MOCK.map((item) => (
              <div key={item.nome} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{item.nome}</p>
                  <p className="text-[11px] text-slate-400">{item.local} • Saldo parado: {item.saldo}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    {item.diasParado} dias sem saída
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Planejamento sugerido: O nutricionista pode alocar esses condimentos ou estocáveis nos cardápios das próximas semanas para evitar perdas por expiração de validade.
          </p>
        </div>
      </div>
    </div>
  );
}