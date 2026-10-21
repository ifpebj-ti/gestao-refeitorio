"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import { listarHistoricoApi, MovimentacaoResponse } from "@/lib/movimentacoes";
import { obterEstoqueMinimoProduto } from "../utils/estoqueRules";
import {
  Bell,
  PackageX,
  TrendingDown,
  CalendarClock,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Layers,
} from "lucide-react";

export type TipoAlerta =
  | "ESTOQUE_ZERADO"
  | "ESTOQUE_BAIXO"
  | "VALIDADE_CRITICA"
  | "VALIDADE_ATENCAO"
  | "PRODUTO_VENCIDO";

export interface LoteValidadeAlerta {
  lote?: string;
  dataValidade: string;
  diasRestantes: number;
  localNome?: string;
}

export interface ItemAlerta {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  saldoAtual: number;
  estoqueMinimo?: number;
  tipoAlerta: TipoAlerta;
  dataValidade?: string;
  diasRestantes?: number;
  localArmazenamento: string;
  lote?: string;
  todosLotesValidade?: LoteValidadeAlerta[];
}

const CATEGORIAS_FILTRO = [
  "Todas",
  "Grãos & Cereais",
  "Proteínas & Frios",
  "Hortifrúti",
  "Laticínios",
  "Especificações & Condimentos",
] as const;

export default function CentralAlertasPage() {
  const { setTotalAlertasPendentes } = useAuth();
  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todas");
  const [termoBusca, setTermoBusca] = useState("");
  const [lotesExpandidos, setLotesExpandidos] = useState<Record<string, boolean>>({});

  const toggleLotesExpandidos = (id: string) => {
    setLotesExpandidos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const [catalogo, historico] = await Promise.all([
        produtoService.listar(),
        listarHistoricoApi().catch((e) => {
          console.error("Erro ao carregar movimentações para validades:", e);
          return [] as MovimentacaoResponse[];
        }),
      ]);
      setProdutos(catalogo);
      setMovimentacoes(historico);
    } catch (err: unknown) {
      console.error("Erro ao carregar alertas:", err);
      setErro("Não foi possível carregar os alertas do estoque no momento.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const calcularDiasRestantes = (dataValidadeStr: string): number => {
    try {
      const [ano, mes, dia] = dataValidadeStr.split("-").map(Number);
      if (!ano || !mes || !dia) return 999;
      const dataVal = new Date(ano, mes - 1, dia);
      dataVal.setHours(0, 0, 0, 0);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const diffMs = dataVal.getTime() - hoje.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  const listaAlertas = useMemo<ItemAlerta[]>(() => {
    if (!produtos || produtos.length === 0) return [];

    const alertas: ItemAlerta[] = [];

    produtos.forEach((prod) => {
      const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
      const estoqueMinimo = obterEstoqueMinimoProduto(prod.quantidadeMinima);
      const catLower = prod.categoria.toLowerCase();
      const localArmazenamento =
        catLower.includes("frio") || catLower.includes("proteína") || catLower.includes("laticínio")
          ? "Câmara de Congelados"
          : "Despensa";

      // 1. Estoque Zerado
      if (saldo <= 0) {
        alertas.push({
          id: `${prod.id}-zerado`,
          nome: prod.nome,
          categoria: prod.categoria,
          unidade: prod.unidadeMedida,
          saldoAtual: saldo,
          estoqueMinimo,
          tipoAlerta: "ESTOQUE_ZERADO",
          localArmazenamento,
        });
      }
      // 2. Estoque Baixo (apenas se houver quantidade mínima configurada e saldo positivo)
      else if (estoqueMinimo !== undefined && saldo <= estoqueMinimo) {
        alertas.push({
          id: `${prod.id}-baixo`,
          nome: prod.nome,
          categoria: prod.categoria,
          unidade: prod.unidadeMedida,
          saldoAtual: saldo,
          estoqueMinimo,
          tipoAlerta: "ESTOQUE_BAIXO",
          localArmazenamento,
        });
      }

      // 3. Validade Real a partir das movimentações de entrada com lote/data
      if (saldo > 0) {
        const entradasValidade = movimentacoes.filter(
          (m) => m.produtoId === prod.id && m.tipo === "ENTRADA" && m.dataValidade
        );

        // Agrupa por combinação única de lote e dataValidade
        const lotesProcessados = new Set<string>();
        const todosLotes: LoteValidadeAlerta[] = [];

        entradasValidade.forEach((entrada) => {
          if (!entrada.dataValidade) return;
          const chave = `${entrada.lote || "sem-lote"}_${entrada.dataValidade}`;
          if (lotesProcessados.has(chave)) return;
          lotesProcessados.add(chave);

          const diasRestantes = calcularDiasRestantes(entrada.dataValidade);

          todosLotes.push({
            lote: entrada.lote,
            dataValidade: entrada.dataValidade,
            diasRestantes,
            localNome: entrada.localNome,
          });
        });

        // Ordena todos os lotes cronologicamente (FEFO: o que vence primeiro vem na frente)
        todosLotes.sort((a, b) => a.diasRestantes - b.diasRestantes);

        // Apenas lotes com validade próxima (<= 7 dias) ou já vencidos (< 0) disparam alerta
        const lotesEmAlerta = todosLotes.filter((l) => l.diasRestantes <= 7);

        if (lotesEmAlerta.length > 0) {
          const loteMaisCritico = lotesEmAlerta[0];

          let tipoAlertaValidade: TipoAlerta = "VALIDADE_ATENCAO";
          if (loteMaisCritico.diasRestantes < 0) {
            tipoAlertaValidade = "PRODUTO_VENCIDO";
          } else if (loteMaisCritico.diasRestantes <= 3) {
            tipoAlertaValidade = "VALIDADE_CRITICA";
          }

          alertas.push({
            id: `${prod.id}-validade`,
            nome: prod.nome,
            categoria: prod.categoria,
            unidade: prod.unidadeMedida,
            saldoAtual: saldo,
            estoqueMinimo,
            tipoAlerta: tipoAlertaValidade,
            dataValidade: loteMaisCritico.dataValidade,
            diasRestantes: loteMaisCritico.diasRestantes,
            localArmazenamento: loteMaisCritico.localNome || localArmazenamento,
            lote: loteMaisCritico.lote,
            todosLotesValidade: todosLotes,
          });
        }
      }
    });

    return alertas;
  }, [produtos, movimentacoes]);

  useEffect(() => {
    setTotalAlertasPendentes(listaAlertas.length);
  }, [listaAlertas.length, setTotalAlertasPendentes]);

  // Contadores
  const kpis = useMemo(() => {
    return {
      total: listaAlertas.length,
      estoqueZerado: listaAlertas.filter((a) => a.tipoAlerta === "ESTOQUE_ZERADO").length,
      estoqueBaixo: listaAlertas.filter((a) => a.tipoAlerta === "ESTOQUE_BAIXO").length,
      validadeProxima: listaAlertas.filter(
        (a) => a.tipoAlerta === "VALIDADE_CRITICA" || a.tipoAlerta === "VALIDADE_ATENCAO"
      ).length,
      vencidos: listaAlertas.filter((a) => a.tipoAlerta === "PRODUTO_VENCIDO").length,
    };
  }, [listaAlertas]);

  const alertasFiltrados = useMemo(() => {
    return listaAlertas.filter((item) => {
      if (filtroTipo === "ESTOQUE_ZERADO" && item.tipoAlerta !== "ESTOQUE_ZERADO") return false;
      if (filtroTipo === "ESTOQUE_BAIXO" && item.tipoAlerta !== "ESTOQUE_BAIXO") return false;
      if (filtroTipo === "VALIDADE" && item.tipoAlerta !== "VALIDADE_CRITICA" && item.tipoAlerta !== "VALIDADE_ATENCAO") return false;
      if (filtroTipo === "VENCIDOS" && item.tipoAlerta !== "PRODUTO_VENCIDO") return false;

      if (filtroCategoria !== "Todas" && item.categoria !== filtroCategoria) return false;

      if (
        termoBusca.trim() &&
        !item.nome.toLowerCase().includes(termoBusca.toLowerCase()) &&
        !item.categoria.toLowerCase().includes(termoBusca.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [listaAlertas, filtroTipo, filtroCategoria, termoBusca]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-20">
      {/* Cabeçalho Enxuto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Central de Alertas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Avisos de estoque baixo e controle de produtos próximos ao vencimento.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarDados}
          disabled={carregando}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${carregando ? "animate-spin text-emerald-600" : ""}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {erro && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-900 text-xs sm:text-sm font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Cards de Resumo Enxutos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setFiltroTipo("TODOS")}
          className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
            filtroTipo === "TODOS" ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total</span>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{kpis.total}</p>
          <span className="text-[11px] text-slate-400">alertas ativos</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroTipo("ESTOQUE_ZERADO")}
          className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
            filtroTipo === "ESTOQUE_ZERADO" ? "border-rose-600 ring-2 ring-rose-600/10" : "border-rose-100 hover:border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Estoque Zerado</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{kpis.estoqueZerado}</p>
          <span className="text-[11px] text-rose-600/70">itens esgotados</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroTipo("ESTOQUE_BAIXO")}
          className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
            filtroTipo === "ESTOQUE_BAIXO" ? "border-amber-600 ring-2 ring-amber-600/10" : "border-amber-100 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Estoque Baixo</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{kpis.estoqueBaixo}</p>
          <span className="text-[11px] text-amber-600/70">abaixo do mínimo</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroTipo("VALIDADE")}
          className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
            filtroTipo === "VALIDADE" ? "border-yellow-600 ring-2 ring-yellow-600/10" : "border-yellow-100 hover:border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-yellow-800">Validade Próxima</span>
            <CalendarClock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-black text-yellow-700 mt-2">{kpis.validadeProxima}</p>
          <span className="text-[11px] text-yellow-700/70">em até 7 dias</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroTipo("VENCIDOS")}
          className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            filtroTipo === "VENCIDOS" ? "border-purple-600 ring-2 ring-purple-600/10" : "border-purple-100 hover:border-purple-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">Vencidos</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-800 mt-2">{kpis.vencidos}</p>
          <span className="text-[11px] text-purple-600/70">expirados</span>
        </button>
      </div>

      {/* Busca e Filtros Rápidos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Filtrar por nome do insumo..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-colors"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {CATEGORIAS_FILTRO.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "Todas" ? "Todas as Categorias" : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setFiltroTipo("TODOS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "TODOS"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({listaAlertas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("ESTOQUE_ZERADO")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "ESTOQUE_ZERADO"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Estoque Zerado ({kpis.estoqueZerado})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("ESTOQUE_BAIXO")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "ESTOQUE_BAIXO"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Estoque Baixo ({kpis.estoqueBaixo})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("VALIDADE")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "VALIDADE"
                ? "bg-yellow-600 text-white"
                : "bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
            }`}
          >
            Validade Próxima ({kpis.validadeProxima})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("VENCIDOS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "VENCIDOS"
                ? "bg-purple-600 text-white"
                : "bg-purple-50 text-purple-800 hover:bg-purple-100"
            }`}
          >
            Vencidos ({kpis.vencidos})
          </button>
        </div>
      </div>

      {/* Lista de Alertas Limpa e Informativa */}
      {carregando ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700">Carregando alertas do estoque...</p>
        </div>
      ) : alertasFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs flex flex-col items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">Nenhum alerta pendente</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            O estoque está operando com níveis adequados e sem prazos de validade críticos.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alertasFiltrados.map((item) => {
            const isVencido = item.tipoAlerta === "PRODUTO_VENCIDO";
            const isValidadeCritica = item.tipoAlerta === "VALIDADE_CRITICA";
            const isEstoqueZerado = item.tipoAlerta === "ESTOQUE_ZERADO";
            const isEstoqueBaixo = item.tipoAlerta === "ESTOQUE_BAIXO";

            const badgeStyle = isVencido
              ? "bg-purple-100 text-purple-900 border-purple-200"
              : isEstoqueZerado
              ? "bg-rose-100 text-rose-900 border-rose-200"
              : isValidadeCritica
              ? "bg-amber-100 text-amber-900 border-amber-200"
              : "bg-slate-100 text-slate-700 border-slate-200";

            const rotuloAlerta = isVencido
              ? "Vencido"
              : isEstoqueZerado
              ? "Estoque Zerado"
              : isValidadeCritica
              ? "Validade Crítica"
              : isEstoqueBaixo
              ? "Estoque Baixo"
              : "Atenção Validade";

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${badgeStyle}`}>
                        {rotuloAlerta}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {item.categoria}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {item.localArmazenamento}
                      </span>
                      {item.lote && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          Lote: {item.lote}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {item.nome}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    {/* Validade */}
                    {item.dataValidade && (
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Validade</span>
                        <p className="text-xs font-extrabold text-slate-800">
                          {(() => {
                            try {
                              const [ano, mes, dia] = item.dataValidade.split("-");
                              return `${dia}/${mes}/${ano}`;
                            } catch {
                              return item.dataValidade;
                            }
                          })()}
                        </p>
                        <p
                          className={`text-[10px] font-bold ${
                            isVencido
                              ? "text-purple-700"
                              : isValidadeCritica
                              ? "text-rose-600"
                              : "text-amber-700"
                          }`}
                        >
                          {isVencido
                            ? `Vencido há ${Math.abs(item.diasRestantes || 0)} dias`
                            : item.diasRestantes === 0
                            ? "Vence hoje"
                            : `Restam ${item.diasRestantes} dias`}
                        </p>
                      </div>
                    )}

                    {/* Saldo */}
                    <div className="text-left sm:text-right min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Atual</span>
                      <p
                        className={`text-xs sm:text-sm font-black ${
                          item.saldoAtual <= 0 ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {item.saldoAtual} {item.unidade}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        mín: {item.estoqueMinimo !== undefined ? `${item.estoqueMinimo} ${item.unidade}` : "--"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão retrátil para verificar todos os lotes e vencimentos */}
                {item.todosLotesValidade && item.todosLotesValidade.length > 1 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleLotesExpandidos(item.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {lotesExpandidos[item.id]
                          ? "Ocultar lotes e vencimentos"
                          : `Ver todos os lotes e vencimentos (${item.todosLotesValidade.length})`}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-transform duration-200 ${
                          lotesExpandidos[item.id] ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Tabela / Lista expandida de todos os lotes */}
                    {lotesExpandidos[item.id] && (
                      <div className="mt-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 animate-in fade-in-50 duration-200">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200/60">
                          <span>Identificação do Lote</span>
                          <span>Vencimento & Situação</span>
                        </div>

                        <div className="space-y-1.5">
                          {item.todosLotesValidade.map((loteItem, idx) => {
                            const [ano, mes, dia] = (loteItem.dataValidade || "").split("-");
                            const dataFormatada =
                              dia && mes && ano ? `${dia}/${mes}/${ano}` : loteItem.dataValidade;

                            const isLoteVencido = loteItem.diasRestantes < 0;
                            const isLoteCritico = !isLoteVencido && loteItem.diasRestantes <= 3;
                            const isLoteAtencao = !isLoteVencido && !isLoteCritico && loteItem.diasRestantes <= 7;

                            const statusBadgeStyle = isLoteVencido
                              ? "bg-purple-100 text-purple-900 border-purple-200"
                              : isLoteCritico
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : isLoteAtencao
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200";

                            const statusTexto = isLoteVencido
                              ? `Venceu há ${Math.abs(loteItem.diasRestantes)}d`
                              : loteItem.diasRestantes === 0
                              ? "Vence hoje"
                              : isLoteCritico || isLoteAtencao
                              ? `Vence em ${loteItem.diasRestantes}d`
                              : `Dentro do prazo (${loteItem.diasRestantes}d)`;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-100 shadow-2xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">
                                    {loteItem.lote ? `Lote ${loteItem.lote}` : "Sem lote especificado"}
                                  </span>
                                  {loteItem.localNome && (
                                    <span className="text-[11px] text-slate-400">• {loteItem.localNome}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <span className="font-extrabold text-slate-800">{dataFormatada}</span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadgeStyle}`}
                                  >
                                    {statusTexto}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
