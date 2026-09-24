"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import { obterEstoqueMinimoPorCategoria, CategoriaAlimento } from "../utils/estoqueRules";
import {
  Bell,
  PackageX,
  TrendingDown,
  CalendarClock,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";

export type TipoAlerta =
  | "ESTOQUE_ZERADO"
  | "ESTOQUE_BAIXO"
  | "VALIDADE_CRITICA"
  | "VALIDADE_ATENCAO"
  | "PRODUTO_VENCIDO";

export interface ItemAlerta {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  saldoAtual: number;
  estoqueMinimo: number;
  tipoAlerta: TipoAlerta;
  dataValidade?: string;
  diasRestantes?: number;
  localArmazenamento: string;
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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todas");
  const [termoBusca, setTermoBusca] = useState("");

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const catalogo = await produtoService.listar();
      setProdutos(catalogo);
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

  const listaAlertas = useMemo<ItemAlerta[]>(() => {
    if (!produtos || produtos.length === 0) return [];

    const hoje = new Date();
    const alertas: ItemAlerta[] = [];

    const obterDadosValidadeSimulados = (prod: ProdutoResponse) => {
      const catLower = prod.categoria.toLowerCase();
      const ehPerecivel =
        catLower.includes("frio") ||
        catLower.includes("proteína") ||
        catLower.includes("proteina") ||
        catLower.includes("laticínio") ||
        catLower.includes("laticinio") ||
        catLower.includes("hortifrúti") ||
        catLower.includes("hortifruti");

      if (!ehPerecivel) return null;

      const hash = prod.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const diasOffset = (hash % 12) - 2;

      const dataVal = new Date();
      dataVal.setDate(hoje.getDate() + diasOffset);

      const diasRestantes = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      return {
        dataValidade: dataVal.toISOString().split("T")[0],
        diasRestantes,
      };
    };

    produtos.forEach((prod) => {
      const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
      const estoqueMinimo = obterEstoqueMinimoPorCategoria(prod.categoria as CategoriaAlimento);
      const catLower = prod.categoria.toLowerCase();
      const localArmazenamento =
        catLower.includes("frio") || catLower.includes("proteína") || catLower.includes("laticínio")
          ? "Câmara de Congelados"
          : "Despensa";

      const validadeInfo = obterDadosValidadeSimulados(prod);

      // Estoque Zerado
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
      // Estoque Baixo
      else if (saldo <= estoqueMinimo) {
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

      // Validade
      if (validadeInfo && saldo > 0) {
        if (validadeInfo.diasRestantes < 0) {
          alertas.push({
            id: `${prod.id}-vencido`,
            nome: prod.nome,
            categoria: prod.categoria,
            unidade: prod.unidadeMedida,
            saldoAtual: saldo,
            estoqueMinimo,
            tipoAlerta: "PRODUTO_VENCIDO",
            dataValidade: validadeInfo.dataValidade,
            diasRestantes: validadeInfo.diasRestantes,
            localArmazenamento,
          });
        } else if (validadeInfo.diasRestantes <= 3) {
          alertas.push({
            id: `${prod.id}-critica`,
            nome: prod.nome,
            categoria: prod.categoria,
            unidade: prod.unidadeMedida,
            saldoAtual: saldo,
            estoqueMinimo,
            tipoAlerta: "VALIDADE_CRITICA",
            dataValidade: validadeInfo.dataValidade,
            diasRestantes: validadeInfo.diasRestantes,
            localArmazenamento,
          });
        } else if (validadeInfo.diasRestantes <= 7) {
          alertas.push({
            id: `${prod.id}-atencao`,
            nome: prod.nome,
            categoria: prod.categoria,
            unidade: prod.unidadeMedida,
            saldoAtual: saldo,
            estoqueMinimo,
            tipoAlerta: "VALIDADE_ATENCAO",
            dataValidade: validadeInfo.dataValidade,
            diasRestantes: validadeInfo.diasRestantes,
            localArmazenamento,
          });
        }
      }
    });

    return alertas;
  }, [produtos]);

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
      if (filtroTipo === "ESTOQUE_BAIXO" && item.tipoAlerta !== "ESTOQUE_BAIXO" && item.tipoAlerta !== "ESTOQUE_ZERADO") return false;
      if (filtroTipo === "VALIDADE" && item.tipoAlerta !== "VALIDADE_CRITICA" && item.tipoAlerta !== "VALIDADE_ATENCAO" && item.tipoAlerta !== "PRODUTO_VENCIDO") return false;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total</span>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{kpis.total}</p>
          <span className="text-[11px] text-slate-400">alertas ativos</span>
        </div>

        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Estoque Zerado</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{kpis.estoqueZerado}</p>
          <span className="text-[11px] text-rose-600/70">itens esgotados</span>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Validade Próxima</span>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{kpis.validadeProxima}</p>
          <span className="text-[11px] text-amber-600/70">em até 7 dias</span>
        </div>

        <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">Vencidos</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-800 mt-2">{kpis.vencidos}</p>
          <span className="text-[11px] text-purple-600/70">expirados</span>
        </div>
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
            onClick={() => setFiltroTipo("ESTOQUE_BAIXO")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "ESTOQUE_BAIXO"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Estoque Baixo ({kpis.estoqueZerado + kpis.estoqueBaixo})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("VALIDADE")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "VALIDADE"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
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
                          {new Date(item.dataValidade).toLocaleDateString("pt-BR")}
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
                        mín: {item.estoqueMinimo} {item.unidade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
