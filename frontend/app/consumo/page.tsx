"use client";

import { useState, useEffect, useMemo } from "react";
import SeletorRefeicao, { TipoRefeicao } from "@/app/components/SeletorRefeicao";
import CardapioCard from "@/app/components/CardapioCard";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  Info,
  AlertTriangle,
  ArrowRight,
  Edit3,
  Lock,
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Package,
} from "lucide-react";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import { registrarSaidaApi } from "@/lib/movimentacoes";

interface ItemFicha {
  id: string;
  nome: string;
  unidade: string;
  categoria: string;
  quantidadeUsada: number;
  saldoTotal: number;
}

const CATEGORIAS_PADRAO = [
  "Grãos & Cereais",
  "Proteínas & Frios",
  "Hortifrúti",
  "Laticínios",
  "Especificações & Condimentos",
] as const;

const LOCAL_CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";
const LOCAL_DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";

const CARDAPIO_MOCK: Record<TipoRefeicao, string> = {
  "Café da Manhã":
    "Cuscuz nordestino com ovos mexidos ou queijo, banana prata, biscoito cream cracker, café e leite quente.",
  "Almoço":
    "Coxa de frango cozida, arroz, feijão macassar, macarrão, ovo cozido, farofa e cuscuz. Salada: tomate, beterraba crua, couve refogada e azeitona.",
  "Jantar":
    "Sopa nutritiva de carne desfiada com macarrão e legumes, torradas temperadas, café e leite.",
};

const HORARIOS_ENCERRAMENTO_MOCK: Record<TipoRefeicao, { hora: string; status: boolean }> = {
  "Café da Manhã": { hora: "08:45", status: true },
  "Almoço": { hora: "13:30", status: true },
  "Jantar": { hora: "19:15", status: false },
};

export default function ConsumoDiarioPage() {
  const { perfil, bannerAlertasVisivel, dispensarBannerAlertas } = useAuth();
  const isNutricionista = perfil === "NUTRICIONISTA";

  const [dataRegistro, setDataRegistro] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tipoRefeicao, setTipoRefeicao] = useState<TipoRefeicao>("Almoço");
  const [itens, setItens] = useState<ItemFicha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [feedbackSucesso, setFeedbackSucesso] = useState(false);
  const [sucessoMensagem, setSucessoMensagem] = useState("");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // Filtros de busca e categoria rápida para tablet (US09)
  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todas");

  const [turnoEncerradoPelaCozinha, setTurnoEncerradoPelaCozinha] = useState(false);
  const [modoEdicaoNutri, setModoEdicaoNutri] = useState(false);

  // Carrega produtos e seus saldos totais da API
  const carregarInsumos = async () => {
    try {
      setCarregando(true);
      setErroEnvio(null);
      const catalogo = await produtoService.listar();

      setItens((prev) => {
        const mapaQtd = new Map(prev.map((i) => [i.id, i.quantidadeUsada]));
        return catalogo.map((prod) => ({
          id: prod.id,
          nome: prod.nome,
          unidade: prod.unidadeMedida,
          categoria: prod.categoria,
          quantidadeUsada: mapaQtd.get(prod.id) || 0,
          saldoTotal: typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0,
        }));
      });
    } catch (err: unknown) {
      console.error("Erro ao carregar insumos do estoque:", err);
      setErroEnvio(
        "Não foi possível carregar os insumos do estoque. Verifique se o servidor está ativo ou se a sessão expirou."
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarInsumos();
  }, []);

  // Simulação de turno e observações para nutricionista
  useEffect(() => {
    const turnoInfo = HORARIOS_ENCERRAMENTO_MOCK[tipoRefeicao];

    if (isNutricionista && turnoInfo.status) {
      setTurnoEncerradoPelaCozinha(true);
      setModoEdicaoNutri(false);

      if (tipoRefeicao === "Almoço") {
        setObservacao(
          "Sobra estimada de aproximadamente 2,5 kg de arroz na bancada de distribuição. Sem intercorrências no cozimento."
        );
      } else if (tipoRefeicao === "Café da Manhã") {
        setObservacao("Consumo regular. Ovos mexidos repostos 1x durante o pico da manhã.");
      }
    } else if (isNutricionista && !turnoInfo.status) {
      setTurnoEncerradoPelaCozinha(false);
      setModoEdicaoNutri(false);
      setObservacao("");
    } else {
      setTurnoEncerradoPelaCozinha(false);
      setModoEdicaoNutri(true);
      setObservacao("");
    }
  }, [isNutricionista, tipoRefeicao]);

  const cardapioAtual = CARDAPIO_MOCK[tipoRefeicao];

  // US12: Controle com validação de saldo negativo e bloqueio do limite
  const alterarQuantidade = (id: string, delta: number) => {
    if (isNutricionista && !modoEdicaoNutri) return;

    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const novoCalculado = Number((item.quantidadeUsada + delta).toFixed(2));
        const saldoMaximo = Math.max(0, item.saldoTotal);

        // Bloqueio contra saldo negativo e contra ultrapassar o estoque
        if (delta > 0 && novoCalculado > saldoMaximo) {
          return { ...item, quantidadeUsada: saldoMaximo };
        }

        return {
          ...item,
          quantidadeUsada: Math.max(0, novoCalculado),
        };
      })
    );
  };

  const definirQuantidadeDireta = (id: string, valor: string) => {
    if (isNutricionista && !modoEdicaoNutri) return;

    const parsed = parseFloat(valor);
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (isNaN(parsed) || parsed < 0) {
          return { ...item, quantidadeUsada: 0 };
        }

        // US12: Bloqueia ultrapassar o saldo atual disponível
        const saldoMaximo = Math.max(0, item.saldoTotal);
        const validado = Math.min(parsed, saldoMaximo);

        return {
          ...item,
          quantidadeUsada: validado,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroEnvio(null);

    const itensParaBaixa = itens.filter((i) => i.quantidadeUsada > 0);

    if (itensParaBaixa.length === 0) {
      setErroEnvio("Selecione a quantidade de pelo menos um insumo para registrar a saída de consumo.");
      return;
    }

    // Validação rígida US12 contra saldo negativo
    const violacoesSaldo = itensParaBaixa.filter((i) => i.quantidadeUsada > i.saldoTotal);
    if (violacoesSaldo.length > 0) {
      const nomes = violacoesSaldo.map((i) => `${i.nome} (Saldo: ${i.saldoTotal} ${i.unidade})`).join(", ");
      setErroEnvio(`Operação cancelada: a quantidade informada excede o saldo em estoque para: ${nomes}.`);
      return;
    }

    try {
      setSalvando(true);

      for (const item of itensParaBaixa) {
        const cat = item.categoria.toLowerCase();
        const ehRefrigerado =
          cat.includes("proteína") ||
          cat.includes("proteina") ||
          cat.includes("frio") ||
          cat.includes("laticínio") ||
          cat.includes("laticinio");

        const localId = ehRefrigerado ? LOCAL_CONGELADOS : LOCAL_DESPENSA;

        await registrarSaidaApi({
          produtoId: item.id,
          localId,
          quantidade: item.quantidadeUsada,
          data: dataRegistro,
          tipoSaida: "CONSUMO",
        });
      }

      setSucessoMensagem(
        isNutricionista
          ? "Conferência e retificações salvas com sucesso no estoque!"
          : `Consumo do ${tipoRefeicao} registrado com sucesso! ${itensParaBaixa.length} ${
              itensParaBaixa.length === 1 ? "insumo baixado" : "insumos baixados"
            }.`
      );
      setFeedbackSucesso(true);

      // Atualiza o catálogo do backend para refletir os novos saldos imediatamente
      await carregarInsumos();

      // Zera quantidades usadas na ficha
      setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })));
      setObservacao("");

      setTimeout(() => {
        setFeedbackSucesso(false);
        if (isNutricionista) {
          setModoEdicaoNutri(false);
        }
      }, 4000);
    } catch (err: unknown) {
      console.error("Erro ao registrar consumo:", err);
      setErroEnvio(
        err instanceof Error
          ? err.message
          : "Erro de comunicação ao registrar consumo. Verifique se você está autenticado e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  };

  // Categorias únicas presentes nos itens
  const todasCategorias = useMemo(() => {
    const setCats = new Set<string>();
    CATEGORIAS_PADRAO.forEach((c) => setCats.add(c));
    itens.forEach((i) => {
      if (i.categoria) setCats.add(i.categoria);
    });
    return Array.from(setCats);
  }, [itens]);

  // Itens filtrados por busca e categoria
  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      const matchBusca =
        !termoBusca.trim() ||
        item.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        item.categoria.toLowerCase().includes(termoBusca.toLowerCase());

      const matchCat =
        categoriaAtiva === "Todas" || item.categoria === categoriaAtiva;

      return matchBusca && matchCat;
    });
  }, [itens, termoBusca, categoriaAtiva]);

  const totalLancados = itens.filter((i) => i.quantidadeUsada > 0).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-32">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {perfil === "COZINHA" ? "Registro de Insumos da Cozinha" : "Conferência de Consumo Diário"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {perfil === "COZINHA"
              ? "Lance as quantidades utilizadas no preparo para baixa direta e balanço diário."
              : "Valide os insumos lançados pela equipe da cozinha ou retifique as quantidades consumidas."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={carregarInsumos}
            disabled={carregando}
            title="Recarregar saldos de estoque"
            className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? "animate-spin text-emerald-600" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          {isNutricionista ? (
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 border border-slate-300 rounded-xl shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="date"
                value={dataRegistro}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDataRegistro(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 border border-slate-200 rounded-xl shadow-2xs select-none">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Hoje</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          )}

          <SeletorRefeicao valor={tipoRefeicao} onChange={setTipoRefeicao} />
        </div>
      </div>

      {/* Alerta de erro de envio ou carregamento */}
      {erroEnvio && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Atenção no Registro</p>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{erroEnvio}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErroEnvio(null)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner de estoque baixo / alertas se visível */}
      {!isNutricionista && bannerAlertasVisivel && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50/70 border border-amber-200/90 rounded-xl text-amber-900 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm font-medium text-amber-950 truncate">
              <strong>Lembrete:</strong> Há insumos com validade próxima ou estoque baixo em atenção.
            </p>
          </div>

          <Link
            href="/alertas"
            onClick={dispensarBannerAlertas}
            className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>Ver avisos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Modo de auditoria do nutricionista */}
      {isNutricionista && turnoEncerradoPelaCozinha && (
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                modoEdicaoNutri ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {modoEdicaoNutri ? <Edit3 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                {modoEdicaoNutri ? "Modo de Ajuste Técnico Ativo" : "Lançamento da Cozinha em Modo Leitura"}
              </p>
              <p className="text-xs text-slate-500">
                {modoEdicaoNutri
                  ? "Você pode alterar valores e salvar as retificações no inventário."
                  : "Os dados abaixo refletem a folha enviada pela cozinha. Clique ao lado para editar se houver divergência."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModoEdicaoNutri(!modoEdicaoNutri)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto ${
              modoEdicaoNutri
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            }`}
          >
            {modoEdicaoNutri ? "Bloquear Edição" : "Habilitar Correção"}
          </button>
        </div>
      )}

      {/* Cardápio do dia planejado */}
      <CardapioCard refeicao={tipoRefeicao} descricao={cardapioAtual} />

      {/* Banner de sucesso */}
      {feedbackSucesso && (
        <div className="p-4 sm:p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 sm:gap-4 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">
              {sucessoMensagem || "Consumo salvo com sucesso!"}
            </p>
            <p className="text-xs text-emerald-100">
              O saldo do estoque foi atualizado automaticamente no sistema.
            </p>
          </div>
        </div>
      )}

      {/* Barra de busca e filtros rápidos para Tablet (US09) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar insumo por nome ou categoria..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setCategoriaAtiva("Todas")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                categoriaAtiva === "Todas"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas ({itens.length})
            </button>
            {todasCategorias.map((cat) => {
              const qtdNaCat = itens.filter((i) => i.categoria === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    categoriaAtiva === cat
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat} ({qtdNaCat})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estado de Carregamento */}
      {carregando && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700">Carregando insumos e saldos de estoque...</p>
          <p className="text-xs text-slate-400">Consultando o banco de dados em tempo real.</p>
        </div>
      )}

      {/* Lista de Insumos da Ficha */}
      {!carregando && itens.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <Package className="w-12 h-12 text-slate-300" />
          <p className="text-base font-bold text-slate-800">Nenhum insumo disponível no catálogo</p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            O catálogo do estoque está vazio. Acesse a tela de Recebimento para cadastrar entradas de mercadorias.
          </p>
          <Link
            href="/recebimento"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
          >
            Ir para Recebimento de Insumos
          </Link>
        </div>
      )}

      {!carregando && itens.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="space-y-4 sm:space-y-6">
            {todasCategorias.map((catNome) => {
              const itensDaCategoria = itensFiltrados.filter((i) => i.categoria === catNome);
              if (itensDaCategoria.length === 0) return null;

              return (
                <div
                  key={catNome}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
                >
                  <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-wide uppercase flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                      <span>{catNome}</span>
                    </h3>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                      {itensDaCategoria.length} {itensDaCategoria.length === 1 ? "item" : "itens"}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {itensDaCategoria.map((item) => {
                      const emUso = item.quantidadeUsada > 0;
                      const desabilitado = isNutricionista && !modoEdicaoNutri;
                      const semEstoque = item.saldoTotal <= 0;
                      const limiteEstoqueAtingido = item.quantidadeUsada >= item.saldoTotal && item.saldoTotal > 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                            emUso ? "bg-emerald-50/40" : semEstoque ? "bg-slate-50/40 opacity-75" : "hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  emUso
                                    ? "bg-emerald-600 scale-125"
                                    : semEstoque
                                    ? "bg-rose-400"
                                    : "bg-slate-300"
                                } transition-transform`}
                              />
                              <span
                                className={`text-sm sm:text-base truncate ${
                                  emUso ? "font-bold text-slate-900" : "font-medium text-slate-700"
                                }`}
                              >
                                {item.nome}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-5 sm:ml-0">
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-xs rounded-md">
                                {item.unidade}
                              </span>

                              {/* US12: Indicador visual claro do Saldo Atual do Estoque */}
                              {semEstoque ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] sm:text-[11px] rounded-md">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  Sem estoque (0 {item.unidade})
                                </span>
                              ) : item.saldoTotal <= 5 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 font-semibold text-[10px] sm:text-[11px] rounded-md">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Disp: {item.saldoTotal} {item.unidade}
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-semibold text-[10px] sm:text-[11px] rounded-md">
                                  Disp: {item.saldoTotal} {item.unidade}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Controles de Quantidade (Tablet Friendly com botões grandes) */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div
                              className={`flex items-center border-2 rounded-xl bg-white shadow-2xs overflow-hidden w-full sm:w-auto justify-between sm:justify-start ${
                                desabilitado || semEstoque
                                  ? "border-slate-200 bg-slate-50 opacity-80"
                                  : limiteEstoqueAtingido
                                  ? "border-amber-300"
                                  : "border-slate-300 focus-within:border-emerald-600"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => alterarQuantidade(item.id, -0.5)}
                                disabled={desabilitado || item.quantidadeUsada <= 0}
                                title="Diminuir quantidade"
                                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>

                              <input
                                type="number"
                                min="0"
                                max={Math.max(0, item.saldoTotal)}
                                step="0.1"
                                disabled={desabilitado || semEstoque}
                                value={item.quantidadeUsada || ""}
                                placeholder="0"
                                onChange={(e) => definirQuantidadeDireta(item.id, e.target.value)}
                                className="w-20 sm:w-24 text-center font-black text-slate-900 text-base sm:text-lg py-2 bg-transparent focus:outline-none disabled:text-slate-400"
                              />

                              <button
                                type="button"
                                onClick={() => alterarQuantidade(item.id, 0.5)}
                                disabled={
                                  desabilitado ||
                                  semEstoque ||
                                  item.quantidadeUsada >= item.saldoTotal
                                }
                                title={
                                  semEstoque
                                    ? "Insumo sem saldo em estoque"
                                    : item.quantidadeUsada >= item.saldoTotal
                                    ? "Limite do estoque atingido"
                                    : "Adicionar quantidade"
                                }
                                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Alerta de limite US12 */}
                            {limiteEstoqueAtingido && (
                              <span className="text-[10px] font-bold text-amber-700">
                                Limite máximo disponível atingido
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observações da Cozinha / Sobras Declaradas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isNutricionista
                  ? "Observações da Cozinha / Sobras Declaradas"
                  : "Observações da Refeição (Sobras ou Ocorrências)"}
              </span>
            </label>
            <textarea
              rows={2}
              value={observacao}
              disabled={isNutricionista && !modoEdicaoNutri}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Sobra de 3kg de arroz; cozimento regular; substituição pontual autorizada..."
              className="w-full border-2 border-slate-200 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>

          <div className="h-16 w-full" aria-hidden="true" />

          {/* Barra Flutuante de Ação no Rodapé (Otimizada para Tablet e Telas Grandes) */}
          <div className="fixed bottom-4 left-0 right-0 lg:pl-64 px-4 sm:px-6 pointer-events-none z-30">
            <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200 py-3 px-4 sm:px-6 rounded-2xl shadow-xl pointer-events-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-sm shrink-0">
                  {totalLancados}
                </span>
                <div className="leading-tight">
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {totalLancados === 1 ? "1 insumo selecionado" : `${totalLancados} insumos selecionados`}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline ml-1.5">
                    • {isNutricionista ? `Registrados no ${tipoRefeicao}` : `Para o ${tipoRefeicao}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isNutricionista && totalLancados > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })))
                    }
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                )}

                <button
                  type="submit"
                  disabled={salvando || (isNutricionista ? !modoEdicaoNutri : totalLancados === 0)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando saída...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isNutricionista ? "Salvar Ajustes" : "Registrar Consumo"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}