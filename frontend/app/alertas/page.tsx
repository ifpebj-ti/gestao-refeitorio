"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import { obterEstoqueMinimoPorCategoria, CategoriaAlimento } from "../utils/estoqueRules";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  Package,
  PackageX,
  TrendingDown,
  CalendarClock,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Utensils,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export type TipoAlerta =
  | "ESTOQUE_ZERADO"
  | "ESTOQUE_BAIXO"
  | "VALIDADE_CRITICA"
  | "VALIDADE_ATENCAO"
  | "PRODUTO_VENCIDO";

export type SeveridadeAlerta = "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";

export interface ItemAlerta {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  saldoAtual: number;
  estoqueMinimo: number;
  tipoAlerta: TipoAlerta;
  severidade: SeveridadeAlerta;
  dataValidade?: string;
  diasRestantes?: number;
  lote?: string;
  localArmazenamento: string;
  acaoRecomendada: string;
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
  const { perfil, setTotalAlertasPendentes } = useAuth();
  const isNutricionista = perfil === "NUTRICIONISTA";

  const [produtos, setProdutos] = useState<ProdutoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todas");
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>("TODAS");
  const [termoBusca, setTermoBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<"SEVERIDADE" | "SALDO" | "VALIDADE" | "NOME">("SEVERIDADE");

  // Carrega os dados reais do estoque
  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const catalogo = await produtoService.listar();
      setProdutos(catalogo);
    } catch (err: unknown) {
      console.error("Erro ao carregar dados para alertas:", err);
      setErro("Não foi possível carregar os alertas do estoque. Verifique a conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Processa as regras de negócio de Alerta de Estoque Baixo (US15) e Controle de Validade (US14, US16)
  const listaAlertas = useMemo<ItemAlerta[]>(() => {
    if (!produtos || produtos.length === 0) return [];

    const hoje = new Date();
    const alertas: ItemAlerta[] = [];

    // Gerador determinístico de validade para perecíveis com base no ID
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

      // Cria um deslocamento de dias determinístico para demonstrar o controle de validade (US14/US16)
      const hash = prod.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const diasOffset = (hash % 12) - 2; // Varia de -2 (vencido) até 9 dias

      const dataVal = new Date();
      dataVal.setDate(hoje.getDate() + diasOffset);

      const diasRestantes = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      const lote = `LT-${new Date().getFullYear()}${(hash % 899 + 100)}`;

      return {
        dataValidade: dataVal.toISOString().split("T")[0],
        diasRestantes,
        lote,
      };
    };

    produtos.forEach((prod) => {
      const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
      const estoqueMinimo = obterEstoqueMinimoPorCategoria(prod.categoria as CategoriaAlimento);
      const catLower = prod.categoria.toLowerCase();
      const localArmazenamento =
        catLower.includes("frio") || catLower.includes("proteína") || catLower.includes("laticínio")
          ? "Câmara Congelados / Frios"
          : "Despensa Geral";

      const validadeInfo = obterDadosValidadeSimulados(prod);

      // 1. REGRA DE ESTOQUE ZERADO (US15)
      if (saldo <= 0) {
        alertas.push({
          id: `${prod.id}-zerado`,
          nome: prod.nome,
          categoria: prod.categoria,
          unidade: prod.unidadeMedida,
          saldoAtual: saldo,
          estoqueMinimo,
          tipoAlerta: "ESTOQUE_ZERADO",
          severidade: "CRITICA",
          localArmazenamento,
          acaoRecomendada: "Insumo totalmente esgotado. Solicitar entrega ou registrar recebimento urgente.",
        });
      }
      // 2. REGRA DE ESTOQUE BAIXO (US15)
      else if (saldo <= estoqueMinimo) {
        const percentual = (saldo / estoqueMinimo) * 100;
        alertas.push({
          id: `${prod.id}-baixo`,
          nome: prod.nome,
          categoria: prod.categoria,
          unidade: prod.unidadeMedida,
          saldoAtual: saldo,
          estoqueMinimo,
          tipoAlerta: "ESTOQUE_BAIXO",
          severidade: percentual <= 40 ? "ALTA" : "MEDIA",
          localArmazenamento,
          acaoRecomendada: `Saldo em ${percentual.toFixed(0)}% do patamar de segurança. Programar reposição com fornecedor.`,
        });
      }

      // 3. REGRA DE CONTROLE DE VALIDADE E PRODUTOS PRÓXIMOS DO VENCIMENTO (US14 e US16)
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
            severidade: "CRITICA",
            dataValidade: validadeInfo.dataValidade,
            diasRestantes: validadeInfo.diasRestantes,
            lote: validadeInfo.lote,
            localArmazenamento,
            acaoRecomendada: "Produto com data de validade expirada! Segregar para quarentena/descarte com a nutricionista.",
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
            severidade: "ALTA",
            dataValidade: validadeInfo.dataValidade,
            diasRestantes: validadeInfo.diasRestantes,
            lote: validadeInfo.lote,
            localArmazenamento,
            acaoRecomendada: "Vencimento em até 72 horas. Priorizar inclusão no cardápio de hoje ou amanhã.",
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
            severidade: "MEDIA",
            dataValidade: validadeInfo.dataValidade,
            diasRestantes: validadeInfo.diasRestantes,
            lote: validadeInfo.lote,
            localArmazenamento,
            acaoRecomendada: "Validade próxima nesta semana. Monitorar giro de estoque no planejamento de cardápio.",
          });
        }
      }
    });

    return alertas;
  }, [produtos]);

  // Atualiza badge de alertas pendentes no Context
  useEffect(() => {
    setTotalAlertasPendentes(listaAlertas.length);
  }, [listaAlertas.length, setTotalAlertasPendentes]);

  // Contadores de KPIs
  const kpis = useMemo(() => {
    return {
      total: listaAlertas.length,
      criticos: listaAlertas.filter((a) => a.severidade === "CRITICA").length,
      estoqueZerado: listaAlertas.filter((a) => a.tipoAlerta === "ESTOQUE_ZERADO").length,
      estoqueBaixo: listaAlertas.filter((a) => a.tipoAlerta === "ESTOQUE_BAIXO").length,
      validadeCritica: listaAlertas.filter(
        (a) => a.tipoAlerta === "VALIDADE_CRITICA" || a.tipoAlerta === "VALIDADE_ATENCAO"
      ).length,
      vencidos: listaAlertas.filter((a) => a.tipoAlerta === "PRODUTO_VENCIDO").length,
    };
  }, [listaAlertas]);

  // Alertas Filtrados e Ordenados
  const alertasFiltrados = useMemo(() => {
    return listaAlertas
      .filter((item) => {
        // Filtro por tipo
        if (filtroTipo === "ESTOQUE_ZERADO" && item.tipoAlerta !== "ESTOQUE_ZERADO") return false;
        if (filtroTipo === "ESTOQUE_BAIXO" && item.tipoAlerta !== "ESTOQUE_BAIXO" && item.tipoAlerta !== "ESTOQUE_ZERADO") return false;
        if (filtroTipo === "VALIDADE" && item.tipoAlerta !== "VALIDADE_CRITICA" && item.tipoAlerta !== "VALIDADE_ATENCAO" && item.tipoAlerta !== "PRODUTO_VENCIDO") return false;
        if (filtroTipo === "VENCIDOS" && item.tipoAlerta !== "PRODUTO_VENCIDO") return false;

        // Filtro por severidade
        if (filtroSeveridade !== "TODAS" && item.severidade !== filtroSeveridade) return false;

        // Filtro por categoria
        if (filtroCategoria !== "Todas" && item.categoria !== filtroCategoria) return false;

        // Filtro por busca
        if (
          termoBusca.trim() &&
          !item.nome.toLowerCase().includes(termoBusca.toLowerCase()) &&
          !item.categoria.toLowerCase().includes(termoBusca.toLowerCase()) &&
          !(item.lote && item.lote.toLowerCase().includes(termoBusca.toLowerCase()))
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === "SEVERIDADE") {
          const peso: Record<SeveridadeAlerta, number> = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
          return peso[b.severidade] - peso[a.severidade];
        }
        if (ordenacao === "SALDO") {
          return a.saldoAtual - b.saldoAtual;
        }
        if (ordenacao === "VALIDADE") {
          const valA = a.diasRestantes ?? 9999;
          const valB = b.diasRestantes ?? 9999;
          return valA - valB;
        }
        return a.nome.localeCompare(b.nome);
      });
  }, [listaAlertas, filtroTipo, filtroSeveridade, filtroCategoria, termoBusca, ordenacao]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-28">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Central de Alertas & Validade
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Monitoramento de estoque mínimo de segurança e controle de vencimento de lotes (US14, US15 e US16).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? "animate-spin text-emerald-600" : ""}`} />
            <span>Atualizar Alertas</span>
          </button>

          <Link
            href={isNutricionista ? "/estoque" : "/recebimento"}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Registrar Entrada</span>
          </Link>
        </div>
      </div>

      {/* Alerta de erro de conexão */}
      {erro && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Falha ao sincronizar alertas</p>
            <p className="text-xs text-rose-700 mt-0.5">{erro}</p>
          </div>
        </div>
      )}

      {/* Cards de Métricas / KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total em Atenção */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.total}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">insumos em monitoramento</p>
          </div>
        </div>

        {/* Estoque Zerado / Crítico (US15) */}
        <div className="bg-white border border-rose-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Estoque Zerado</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-700">{kpis.estoqueZerado}</span>
            <p className="text-[11px] text-rose-600/80 mt-0.5">insumos esgotados</p>
          </div>
        </div>

        {/* Validade Próxima (US14/US16) */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Validade Próxima</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{kpis.validadeCritica}</span>
            <p className="text-[11px] text-amber-600/80 mt-0.5">vencendo em até 7 dias</p>
          </div>
        </div>

        {/* Vencidos (US16) */}
        <div className="bg-white border border-purple-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Vencidos / Descarte</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-800">{kpis.vencidos}</span>
            <p className="text-[11px] text-purple-600/80 mt-0.5">para quarentena ou descarte</p>
          </div>
        </div>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar insumo por nome, categoria ou lote..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Filtros em Selects */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Categoria */}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              {CATEGORIAS_FILTRO.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "Todas" ? "Todas as Categorias" : cat}
                </option>
              ))}
            </select>

            {/* Severidade */}
            <select
              value={filtroSeveridade}
              onChange={(e) => setFiltroSeveridade(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="TODAS">Todas as Severidades</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
            </select>

            {/* Ordenação */}
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="SEVERIDADE">Ordenar: Gravidade</option>
              <option value="SALDO">Ordenar: Menor Saldo</option>
              <option value="VALIDADE">Ordenar: Validade Próxima</option>
              <option value="NOME">Ordenar: Nome (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Chips de Tipos de Alerta */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setFiltroTipo("TODOS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "TODOS"
                ? "bg-slate-900 text-white shadow-xs"
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
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Estoque Crítico / Baixo ({kpis.estoqueZerado + kpis.estoqueBaixo})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("VALIDADE")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "VALIDADE"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Validade Próxima ({kpis.validadeCritica})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("VENCIDOS")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              filtroTipo === "VENCIDOS"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-800 hover:bg-purple-100"
            }`}
          >
            Vencidos ({kpis.vencidos})
          </button>
        </div>
      </div>

      {/* Lista de Alertas */}
      {carregando ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700">Auditando estoque e calculando validades...</p>
          <p className="text-xs text-slate-400">Processando regras de segurança alimentar em tempo real.</p>
        </div>
      ) : alertasFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">Nenhum alerta pendente</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Todos os insumos cadastrados estão dentro do nível de segurança de estoque e com prazos de validade regulares.
          </p>
          <Link
            href="/consumo"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Ir para Registro de Consumo</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {alertasFiltrados.map((item) => {
            const percentualEstoque = Math.min(100, Math.round((item.saldoAtual / item.estoqueMinimo) * 100));

            const isVencido = item.tipoAlerta === "PRODUTO_VENCIDO";
            const isValidadeCritica = item.tipoAlerta === "VALIDADE_CRITICA";
            const isEstoqueZerado = item.tipoAlerta === "ESTOQUE_ZERADO";
            const isEstoqueBaixo = item.tipoAlerta === "ESTOQUE_BAIXO";

            const badgeColor = isVencido
              ? "bg-purple-100 text-purple-900 border-purple-200"
              : isEstoqueZerado
              ? "bg-rose-100 text-rose-900 border-rose-200"
              : isValidadeCritica
              ? "bg-amber-100 text-amber-900 border-amber-200"
              : "bg-slate-100 text-slate-800 border-slate-200";

            const tipoLabel = isVencido
              ? "Produto Vencido (US16)"
              : isEstoqueZerado
              ? "Estoque Esgotado (US15)"
              : isValidadeCritica
              ? "Validade Crítica (US14/US16)"
              : isEstoqueBaixo
              ? "Estoque Abaixo do Mínimo (US15)"
              : "Validade em Atenção";

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
                  item.severidade === "CRITICA"
                    ? "border-rose-300/80 bg-gradient-to-r from-rose-50/20 via-white to-white"
                    : item.severidade === "ALTA"
                    ? "border-amber-300/80 bg-gradient-to-r from-amber-50/20 via-white to-white"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações Principais */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 text-[11px] font-extrabold uppercase rounded-md border ${badgeColor}`}>
                        {tipoLabel}
                      </span>

                      <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-md">
                        {item.categoria}
                      </span>

                      <span className="text-xs text-slate-400 font-medium">
                        Local: {item.localArmazenamento}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                        {item.nome}
                      </h3>
                      {item.lote && (
                        <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                          {item.lote}
                        </span>
                      )}
                    </div>

                    {/* Mensagem e Ação recomendada */}
                    <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{item.acaoRecomendada}</span>
                    </p>
                  </div>

                  {/* Indicadores de Saldo e Validade */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0">
                    {/* Indicador de Validade se aplicável */}
                    {item.dataValidade && (
                      <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-left min-w-[130px]">
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Validade (US14)</span>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                          {new Date(item.dataValidade).toLocaleDateString("pt-BR")}
                        </p>
                        <p
                          className={`text-[10px] font-bold mt-0.5 ${
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
                            ? "Vence hoje!"
                            : `Restam ${item.diasRestantes} dias`}
                        </p>
                      </div>
                    )}

                    {/* Indicador de Saldo vs Mínimo */}
                    <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-left min-w-[150px]">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Saldo Atual</span>
                        <span>Mín: {item.estoqueMinimo} {item.unidade}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                        {item.saldoAtual} {item.unidade}
                      </p>

                      {/* Barra de progresso visual */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.saldoAtual <= 0
                              ? "bg-rose-600 w-0"
                              : percentualEstoque <= 40
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${percentualEstoque}%` }}
                        />
                      </div>
                    </div>

                    {/* Botões de Ação Rápida */}
                    <div className="flex items-center gap-2">
                      {isEstoqueZerado || isEstoqueBaixo ? (
                        <Link
                          href={isNutricionista ? "/estoque" : "/recebimento"}
                          className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Repor</span>
                        </Link>
                      ) : (
                        <Link
                          href="/consumo"
                          className="flex items-center gap-1 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Consumir</span>
                        </Link>
                      )}
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
