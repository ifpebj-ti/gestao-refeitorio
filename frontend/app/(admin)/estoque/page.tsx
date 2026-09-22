"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  PackagePlus,
  Building2,
  CheckCircle2,
  Upload,
  Camera,
  FileText,
  Eye,
  X,
  ImageIcon,
} from "lucide-react";
import { verificarStatusEstoque, CategoriaAlimento } from "@/app/utils/estoqueRules";
import { produtoService, ProdutoResponse } from "@/lib/produtos";

interface ItemMovimentadoDetalhe {
  insumo: string;
  quantidade: number;
  unidade: string;
}

interface MovimentacaoExtrato {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  dataHora: string;
  origemTurno: string;
  responsavel: string;
  itensResumo: string;
  detalhesItens: ItemMovimentadoDetalhe[];
  fornecedor?: string;
  lote?: string;
  validade?: string;
  observacao?: string;
  fotoAnexada?: string;
}

const CATEGORIAS = [
  "Todos",
  "Grãos & Cereais",
  "Proteínas & Frios",
  "Hortifrúti",
  "Laticínios",
  "Especificações & Condimentos",
] as const;

const EXTRATO_INICIAL: MovimentacaoExtrato[] = [
  {
    id: "m1",
    tipo: "SAIDA",
    dataHora: "04/09/2026 13:30",
    origemTurno: "Consumo • Almoço",
    responsavel: "Equipe Cozinha (Maria das Dores e Severina)",
    itensResumo: "Coxa de Frango (45kg), Arroz (30kg), Feijão Macassar (18kg)...",
    detalhesItens: [
      { insumo: "Coxa de Frango", quantidade: 45, unidade: "Kg" },
      { insumo: "Arroz Parboilizado", quantidade: 30, unidade: "Kg" },
      { insumo: "Feijão Macassar", quantidade: 18, unidade: "Kg" },
    ],
    observacao: "Sobra de cerca de 2,5 kg de arroz pronto na bancada.",
  },
  {
    id: "m2",
    tipo: "ENTRADA",
    dataHora: "04/09/2026 09:15",
    origemTurno: "Recebimento • Hortifrúti",
    responsavel: "Recepção / Cozinha",
    fornecedor: "Produtor Feirante Local (Agricultura Familiar)",
    lote: "HORTI-0409",
    validade: "09/09/2026",
    itensResumo: "Tomate (+25kg), Couve (+20 maços), Beterraba (+15kg)",
    detalhesItens: [
      { insumo: "Tomate", quantidade: 25, unidade: "Kg" },
      { insumo: "Couve", quantidade: 20, unidade: "Maço" },
      { insumo: "Beterraba", quantidade: 15, unidade: "Kg" },
    ],
    observacao: "Carga fresca entregue em caixas plásticas higienizadas.",
    fotoAnexada: "Foto do canhoto/entrega anexada",
  },
];

export default function EstoqueGeralPage() {
  const router = useRouter();
  const { autenticado, carregando } = useAuth();

  // Abas e filtros
  const [abaAtiva, setAbaAtiva] = useState<"inventario" | "registrar" | "extrato">("inventario");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todos");

  // Dados do backend
  const [listaEstoque, setListaEstoque] = useState<ProdutoResponse[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState<boolean>(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Extrato de auditoria
  const [extrato, setExtrato] = useState<MovimentacaoExtrato[]>(EXTRATO_INICIAL);
  const [itemAuditoriaSelecionado, setItemAuditoriaSelecionado] = useState<MovimentacaoExtrato | null>(null);

  // Formulário da Aba Registrar Entrada
  const [categoriaEntradaAtiva, setCategoriaEntradaAtiva] = useState<string>("Todos");
  const [buscaEntrada, setBuscaEntrada] = useState("");
  const [buscaEntradaFocada, setBuscaEntradaFocada] = useState(false);
  const [itemEntradaId, setItemEntradaId] = useState<string>("");

  const [fornecedorEntrada, setFornecedorEntrada] = useState("");
  const [quantidadeEntrada, setQuantidadeEntrada] = useState("");
  const [validadeEntrada, setValidadeEntrada] = useState("");
  const [loteEntrada, setLoteEntrada] = useState("");
  const [fotoMercadoria, setFotoMercadoria] = useState<string | null>(null);
  const [sucessoFeedback, setSucessoFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redireciona para login se deslogado
  useEffect(() => {
    if (!carregando && !autenticado) {
      router.push("/login");
    }
  }, [autenticado, carregando, router]);

  // Busca dados na API
  const carregarProdutos = async () => {
    try {
      setCarregandoProdutos(true);
      setErroCarregamento(null);
      const dados = await produtoService.listar(
        categoriaFiltro === "Todos" ? undefined : categoriaFiltro
      );
      setListaEstoque(dados);
    } catch (error) {
      console.error("Erro ao carregar catálogo de produtos:", error);
      setErroCarregamento("Não foi possível carregar os produtos do estoque.");
    } finally {
      setCarregandoProdutos(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      carregarProdutos();
    }
  }, [autenticado, categoriaFiltro]);

  if (carregando || !autenticado) {
    return null;
  }

  // Objeto selecionado no formulário de entrada
  const insumoEntradaSelecionado = listaEstoque.find((i) => i.id === itemEntradaId) || null;

  // Calcula status de atenção usando os dados reais da API
  const calcularStatusItem = (item: ProdutoResponse): "NORMAL" | "ATENCAO" => {
    const statusSaldo = verificarStatusEstoque(
      item.saldoTotal ?? 0,
      item.unidadeMedida,
      item.categoria as CategoriaAlimento
    );
    return statusSaldo === "ATENCAO" ? "ATENCAO" : "NORMAL";
  };

  // Filtros de busca no cliente
  const itensFiltrados = listaEstoque.filter((item) => {
    const bateCategoria =
      categoriaFiltro === "Todos" || item.categoria === categoriaFiltro;
    const bateBusca =
      busca.trim() === "" ||
      item.nome.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  const insumosEntradaFiltrados = listaEstoque.filter((item) => {
    const bateCategoria =
      categoriaEntradaAtiva === "Todos" || item.categoria === categoriaEntradaAtiva;
    const bateBusca =
      buscaEntrada.trim() === "" ||
      item.nome.toLowerCase().includes(buscaEntrada.toLowerCase());
    return bateCategoria && bateBusca;
  });

  const totalAtencao = listaEstoque.filter((i) => calcularStatusItem(i) === "ATENCAO").length;

  const alternarSelecaoInsumo = (item: ProdutoResponse) => {
    if (itemEntradaId === item.id) {
      limparSelecao();
    } else {
      setItemEntradaId(item.id);
      setBuscaEntrada(item.nome);
      setBuscaEntradaFocada(false);
    }
  };

  const limparSelecao = () => {
    setItemEntradaId("");
    setBuscaEntrada("");
    setBuscaEntradaFocada(false);
    setQuantidadeEntrada("");
    setFornecedorEntrada("");
    setValidadeEntrada("");
    setLoteEntrada("");
    setFotoMercadoria(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removerFoto = () => {
    setFotoMercadoria(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const registrarNovaEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoEntradaSelecionado) return;
    const qtdNum = parseFloat(quantidadeEntrada);
    if (isNaN(qtdNum) || qtdNum <= 0 || !fornecedorEntrada.trim()) return;

    // Atualiza saldo local enquanto US07/entrada completa no back é finalizada
    setListaEstoque((prev) =>
      prev.map((i) =>
        i.id === itemEntradaId
          ? {
              ...i,
              saldoTotal: Number(((i.saldoTotal ?? 0) + qtdNum).toFixed(2)),
            }
          : i
      )
    );

    const novaMovimentacao: MovimentacaoExtrato = {
      id: Math.random().toString(),
      tipo: "ENTRADA",
      dataHora: "21/09/2026 11:30",
      origemTurno: "Recebimento • Entrada de Insumo",
      responsavel: "Nutricionista Hítalo",
      fornecedor: fornecedorEntrada.trim(),
      validade: validadeEntrada || undefined,
      lote: loteEntrada || undefined,
      itensResumo: `${insumoEntradaSelecionado.nome} (+${qtdNum} ${insumoEntradaSelecionado.unidadeMedida})`,
      detalhesItens: [
        {
          insumo: insumoEntradaSelecionado.nome,
          quantidade: qtdNum,
          unidade: insumoEntradaSelecionado.unidadeMedida,
        },
      ],
      observacao: "Entrada registrada e conferida pela Nutrição.",
      fotoAnexada: fotoMercadoria || undefined,
    };

    setExtrato((prev) => [novaMovimentacao, ...prev]);
    setSucessoFeedback(true);

    setTimeout(() => {
      setSucessoFeedback(false);
      limparSelecao();
      setAbaAtiva("inventario");
    }, 1200);
  };

  const podeSalvar =
    insumoEntradaSelecionado &&
    fornecedorEntrada.trim().length > 0 &&
    Boolean(quantidadeEntrada) &&
    parseFloat(quantidadeEntrada) > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO PADRÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Entradas & Estoque
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {listaEstoque.length} insumos catalogados • {totalAtencao} itens em atenção de reposição
          </p>
        </div>
      </div>

      {/* 2. ABAS */}
      <div className="flex items-center gap-4 border-b border-slate-200 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setAbaAtiva("inventario")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "inventario"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Inventário ({itensFiltrados.length})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("registrar")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "registrar"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Registrar Entrada
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("extrato")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "extrato"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Histórico de Auditoria ({extrato.length})
        </button>
      </div>

      {/* 3. ABA 1: INVENTÁRIO */}
      {abaAtiva === "inventario" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar insumo..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoriaFiltro === cat
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Saldo Atual</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {carregandoProdutos ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                      Carregando produtos do estoque...
                    </td>
                  </tr>
                ) : erroCarregamento ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-rose-600 font-medium">
                      {erroCarregamento}
                    </td>
                  </tr>
                ) : itensFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                      Nenhum produto cadastrado no banco de dados.
                    </td>
                  </tr>
                ) : (
                  itensFiltrados.map((item) => {
                    const statusItem = calcularStatusItem(item);
                    const isAtencao = statusItem === "ATENCAO";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.nome}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {item.categoria}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                          {item.saldoTotal ?? 0} {item.unidadeMedida}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isAtencao ? (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Atenção
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 text-xs">
                          -
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ABA 2: REGISTRAR ENTRADA */}
      {abaAtiva === "registrar" && (
        <div className="w-full space-y-6">
          {sucessoFeedback ? (
            <div className="p-8 text-center space-y-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-base font-extrabold text-slate-900">Entrada Confirmada!</p>
              <p className="text-xs text-slate-500">O saldo foi somado ao inventário e registrado no histórico.</p>
            </div>
          ) : (
            <form onSubmit={registrarNovaEntrada} className="w-full space-y-5">
              <div className="bg-emerald-50/50 border-2 border-emerald-200/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                    <PackagePlus className="w-5 h-5 text-emerald-600" />
                    <span>Selecionar Insumo ({insumosEntradaFiltrados.length} encontrados)</span>
                  </h2>

                  {insumoEntradaSelecionado && (
                    <div className="flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                      <span>Selecionado: {insumoEntradaSelecionado.nome}</span>
                      <button
                        type="button"
                        onClick={limparSelecao}
                        className="hover:bg-emerald-100 rounded-full p-0.5 text-emerald-700 cursor-pointer"
                        title="Desmarcar seleção"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaEntradaAtiva(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        categoriaEntradaAtiva === cat
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={buscaEntrada}
                    onFocus={() => setBuscaEntradaFocada(true)}
                    onChange={(e) => {
                      setBuscaEntrada(e.target.value);
                      setBuscaEntradaFocada(true);
                    }}
                    placeholder="Digite o nome do insumo ou escolha abaixo..."
                    className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />

                  {buscaEntrada.length > 0 && (
                    <button
                      type="button"
                      onClick={limparSelecao}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {buscaEntradaFocada && buscaEntrada.trim().length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border-2 border-emerald-400 rounded-xl shadow-xl z-30 divide-y divide-slate-100">
                      {insumosEntradaFiltrados.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center font-medium">
                          Nenhum insumo encontrado com &quot;{buscaEntrada}&quot;
                        </div>
                      ) : (
                        insumosEntradaFiltrados.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={() => alternarSelecaoInsumo(item)}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer"
                          >
                            <span>{item.nome}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              {item.categoria} • {item.unidadeMedida}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                  {insumosEntradaFiltrados.map((item) => {
                    const selecionado = itemEntradaId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => alternarSelecaoInsumo(item)}
                        className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selecionado
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-xs scale-105"
                            : "bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50"
                        }`}
                      >
                        <span>{item.nome}</span>
                        {selecionado && <X className="w-3 h-3 text-white/80 hover:text-white" />}
                      </button>
                    );
                  })}
                </div>

                {!insumoEntradaSelecionado && (
                  <div className="pt-3 border-t border-emerald-200/80 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold text-emerald-950 uppercase block mb-1">
                      Ou selecione diretamente no seletor completo:
                    </label>
                    <select
                      value={itemEntradaId}
                      onChange={(e) => {
                        const item = listaEstoque.find((i) => i.id === e.target.value);
                        if (item) {
                          alternarSelecaoInsumo(item);
                        } else {
                          limparSelecao();
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="">-- Nenhum insumo selecionado --</option>
                      {listaEstoque.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome} ({i.categoria} • {i.unidadeMedida})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {insumoEntradaSelecionado ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      Dados do Recebimento: {insumoEntradaSelecionado.nome}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      Unidade: <strong className="text-emerald-700">{insumoEntradaSelecionado.unidadeMedida}</strong>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Fornecedor / Origem da Entrega *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fornecedorEntrada}
                      onChange={(e) => setFornecedorEntrada(e.target.value)}
                      placeholder="Ex.: Distribuidora Agreste, Cooperativa..."
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Quantidade Recebida ({insumoEntradaSelecionado.unidadeMedida}) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={quantidadeEntrada}
                      onChange={(e) => setQuantidadeEntrada(e.target.value)}
                      placeholder="Ex.: 30"
                      className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Data de Validade (opcional)
                      </label>
                      <input
                        type="date"
                        value={validadeEntrada}
                        onChange={(e) => setValidadeEntrada(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Número do Lote (opcional)
                      </label>
                      <input
                        type="text"
                        value={loteEntrada}
                        onChange={(e) => setLoteEntrada(e.target.value)}
                        placeholder="LT-2026"
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Foto do Produto / Canhoto (Opcional)</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50/50 transition-colors">
                      {fotoMercadoria ? (
                        <div className="flex items-center justify-between text-xs text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            <span>Foto anexada com sucesso</span>
                          </div>
                          <button
                            type="button"
                            onClick={removerFoto}
                            className="text-slate-400 hover:text-slate-700 underline font-normal cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer space-y-1 block">
                          <Upload className="w-6 h-6 mx-auto text-slate-400" />
                          <p className="text-xs font-semibold text-slate-700">
                            Fotografar os produtos descarregados ou canhoto
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={() => setFotoMercadoria("foto-mercadoria-recebida.jpg")}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={limparSelecao}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Limpar
                    </button>

                    <button
                      type="submit"
                      disabled={!podeSalvar}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Entrada no Estoque</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200/80 rounded-xl">
                  Selecione um insumo acima para abrir os campos de registro.
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* 5. ABA 3: HISTÓRICO COM VISUALIZAÇÃO AUDITÁVEL */}
      {abaAtiva === "extrato" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase text-slate-600 tracking-wide">
              Registros Cronológicos de Movimentação
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
            {extrato.map((mov) => {
              const isEntrada = mov.tipo === "ENTRADA";

              return (
                <div
                  key={mov.id}
                  onClick={() => setItemAuditoriaSelecionado(mov)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors text-xs sm:text-sm cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isEntrada
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isEntrada ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 truncate">
                          {mov.origemTurno}
                        </p>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            isEntrada
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isEntrada ? "ENTRADA" : "SAÍDA"}
                        </span>
                      </div>

                      <p className="text-slate-500 text-xs truncate">
                        {mov.itensResumo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
                      {mov.dataHora}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 group-hover:text-emerald-700 group-hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Auditar detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. MODAL DE AUDITORIA DO REGISTRO */}
      {itemAuditoriaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    itemAuditoriaSelecionado.tipo === "ENTRADA"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Ficha de Auditoria do Lançamento
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ID: {itemAuditoriaSelecionado.id} • {itemAuditoriaSelecionado.dataHora}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setItemAuditoriaSelecionado(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Tipo / Turno
                </span>
                <span className="font-extrabold text-slate-800">
                  {itemAuditoriaSelecionado.origemTurno}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Responsável
                </span>
                <span className="font-semibold text-slate-800">
                  {itemAuditoriaSelecionado.responsavel}
                </span>
              </div>

              {itemAuditoriaSelecionado.fornecedor && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Fornecedor / Origem
                  </span>
                  <span className="font-medium text-slate-700">
                    {itemAuditoriaSelecionado.fornecedor}
                  </span>
                </div>
              )}

              {itemAuditoriaSelecionado.lote && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Lote / Validade
                  </span>
                  <span className="font-medium text-slate-700">
                    {itemAuditoriaSelecionado.lote}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                Discriminação dos Insumos
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {itemAuditoriaSelecionado.detalhesItens.map((det, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium">{det.insumo}</td>
                        <td className="px-3 py-2 text-right font-extrabold text-slate-900">
                          {det.quantidade} {det.unidade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {itemAuditoriaSelecionado.observacao && (
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                  Ocorrências
                </span>
                <p className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl leading-relaxed">
                  {itemAuditoriaSelecionado.observacao}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setItemAuditoriaSelecionado(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}