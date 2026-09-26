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
import { registrarEntradaApi, listarHistoricoApi } from "@/lib/movimentacoes"; 

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

export default function EstoqueGeralPage() {
  const router = useRouter();
  const { autenticado, carregando, perfil } = useAuth();

  // Abas e filtros
  const [abaAtiva, setAbaAtiva] = useState<"inventario" | "registrar" | "extrato">("inventario");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todos");

  // Dados do backend
  const [listaEstoque, setListaEstoque] = useState<ProdutoResponse[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState<boolean>(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Extrato de auditoria
  const [extrato, setExtrato] = useState<MovimentacaoExtrato[]>([]);
  const [carregandoExtrato, setCarregandoExtrato] = useState(false); 
  const [itemAuditoriaSelecionado, setItemAuditoriaSelecionado] = useState<MovimentacaoExtrato | null>(null);
  
  // Estado para a foto do modal de auditoria
  const [fotoAuditoria, setFotoAuditoria] = useState<string | null>(null);
  const [carregandoFotoAuditoria, setCarregandoFotoAuditoria] = useState(false);

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
  const [arquivoFotoReal, setArquivoFotoReal] = useState<File | null>(null);
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);
  const [erroEntrada, setErroEntrada] = useState<string | null>(null);
  const [sucessoFeedback, setSucessoFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!carregando) {
      if (!autenticado) {
        router.push("/consumo");
      } else if (perfil === "ADMIN") {
        router.push("/usuarios");
      }
    }
  }, [autenticado, carregando, perfil, router]);

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

  // Função para buscar a foto ao abrir o modal
  useEffect(() => {
    const buscarFoto = async (id: string) => {
      setCarregandoFotoAuditoria(true);
      try {
        const token = localStorage.getItem("@gestao_refeitorio:token");
        const res = await fetch(`http://localhost:8080/api/movimentacoes/${id}/foto`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const blob = await res.blob();
          setFotoAuditoria(URL.createObjectURL(blob));
        } else {
          setFotoAuditoria(null);
        }
      } catch (e) {
        setFotoAuditoria(null);
      } finally {
        setCarregandoFotoAuditoria(false);
      }
    };

    if (itemAuditoriaSelecionado) {
      buscarFoto(itemAuditoriaSelecionado.id);
    } else {
      setFotoAuditoria(null); 
    }
  }, [itemAuditoriaSelecionado]);

  const carregarHistorico = async () => {
    try {
      setCarregandoExtrato(true);
      const dados = await listarHistoricoApi();
      
      const extratoFormatado: MovimentacaoExtrato[] = dados.map((mov) => {
        let dataFormatada = mov.data;
        try {
          if (mov.data) {
            const dataObj = new Date(mov.data);
            if (!isNaN(dataObj.getTime())) {
               dataFormatada = dataObj.toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric"
              });
            }
          }
        } catch (e) {}

        const nomeInsumo = listaEstoque.find(p => p.id === mov.produtoId)?.nome || "Produto Desconhecido";
        const unidade = listaEstoque.find(p => p.id === mov.produtoId)?.unidadeMedida || "un";

        return {
          id: mov.id,
          tipo: mov.tipo,
          dataHora: dataFormatada,
          origemTurno: mov.tipo === "ENTRADA" ? "Recebimento • Entrada" : `Saída • ${mov.tipoSaida || 'Consumo'}`,
          responsavel: "Equipe (Cozinha/Nutrição)", 
          fornecedor: mov.origem === "EXTERNA" ? "Fornecedor Externo Comum" : "Agroindústria (IFPE)",
          itensResumo: `${nomeInsumo} (${mov.tipo === 'ENTRADA' ? '+' : '-'}${mov.quantidade} ${unidade})`,
          detalhesItens: [
            {
              insumo: nomeInsumo,
              quantidade: mov.quantidade,
              unidade: unidade,
            },
          ],
          observacao: mov.tipo === "ENTRADA" 
            ? "Entrada de insumos conferida e registrada via sistema." 
            : "Saída de insumos registrada via sistema.",
        };
      });

      setExtrato(extratoFormatado.reverse());
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregandoExtrato(false);
    }
  };

  useEffect(() => {
    if (abaAtiva === "extrato" && autenticado) {
      carregarHistorico();
    }
  }, [abaAtiva, autenticado, listaEstoque]); 

  if (carregando || !autenticado) {
    return null;
  }

  const insumoEntradaSelecionado = listaEstoque.find((i) => i.id === itemEntradaId) || null;

  const calcularStatusItem = (item: ProdutoResponse): "NORMAL" | "ATENCAO" => {
    const statusSaldo = verificarStatusEstoque(
      item.saldoTotal ?? 0,
      item.unidadeMedida,
      item.categoria as CategoriaAlimento
    );
    return statusSaldo === "ATENCAO" ? "ATENCAO" : "NORMAL";
  };

  const itensFiltrados = listaEstoque.filter((item) => {
    const bateCategoria = categoriaFiltro === "Todos" || item.categoria === categoriaFiltro;
    const bateBusca = busca.trim() === "" || item.nome.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  const insumosEntradaFiltrados = listaEstoque.filter((item) => {
    const bateCategoria = categoriaEntradaAtiva === "Todos" || item.categoria === categoriaEntradaAtiva;
    const bateBusca = buscaEntrada.trim() === "" || item.nome.toLowerCase().includes(buscaEntrada.toLowerCase());
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
    setArquivoFotoReal(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removerFoto = () => {
    setFotoMercadoria(null);
    setArquivoFotoReal(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSalvarEntrada = async () => {
    if (!insumoEntradaSelecionado) {
      alert("Selecione um insumo da lista!");
      return;
    }

    const qtdNum = parseFloat(quantidadeEntrada);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      alert("Informe uma quantidade válida maior que zero!");
      return;
    }

    if (!fornecedorEntrada.trim()) {
      alert("Informe o fornecedor!");
      return;
    }

    const LOCAL_CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";
    const LOCAL_DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";
    const localId =
      insumoEntradaSelecionado.categoria === "Proteínas & Frios"
        ? LOCAL_CONGELADOS
        : LOCAL_DESPENSA;

    const ehAgro = fornecedorEntrada.toLowerCase().includes("agro");
    const origem = ehAgro ? "AGROINDUSTRIA" : "EXTERNA";

    const precoUnitario =
      insumoEntradaSelecionado.valorReferencia && insumoEntradaSelecionado.valorReferencia > 0
        ? insumoEntradaSelecionado.valorReferencia
        : 10.0;
    const valorTotal = Number((qtdNum * precoUnitario).toFixed(2));

    const hojeIso = new Date().toISOString().split("T")[0];

    try {
      setSalvandoEntrada(true);
      setErroEntrada(null);

      await registrarEntradaApi(
        {
          produtoId: insumoEntradaSelecionado.id,
          localId,
          quantidade: qtdNum,
          data: hojeIso,
          origem,
          valor: valorTotal,
        },
        arquivoFotoReal
      );

      await carregarProdutos();
      
      setSucessoFeedback(true);

      setTimeout(() => {
        setSucessoFeedback(false);
        limparSelecao();
        setAbaAtiva("inventario");
      }, 1200);
    } catch (err: any) {
      console.error("Falha ao registrar entrada:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Não foi possível salvar a entrada no estoque.";
      alert("ERRO AO SALVAR NO BANCO: " + msg);
      setErroEntrada(msg);
    } finally {
      setSalvandoEntrada(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
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
          Histórico de Auditoria
        </button>
      </div>

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

          {/* 1. Visualização Mobile: Cards */}
          <div className="block md:hidden space-y-3">
            {carregandoProdutos ? (
              <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
                Carregando produtos do estoque...
              </div>
            ) : erroCarregamento ? (
              <div className="p-8 text-center text-rose-600 font-medium bg-white rounded-2xl border border-slate-200">
                {erroCarregamento}
              </div>
            ) : itensFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
                Nenhum produto cadastrado no banco de dados.
              </div>
            ) : (
              itensFiltrados.map((item) => {
                const statusItem = calcularStatusItem(item);
                const isAtencao = statusItem === "ATENCAO";

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {item.nome}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.categoria}
                        </span>
                      </div>
                      <div>
                        {isAtencao ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                            Atenção
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                            Normal
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">Saldo Atual:</span>
                      <span className="text-base font-black text-slate-900">
                        {item.saldoTotal ?? 0} <span className="text-xs font-semibold text-slate-600">{item.unidadeMedida}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. Visualização Desktop: Tabela Completa */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
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
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.nome}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.categoria}</td>
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
                        <td className="px-4 py-3 text-right text-slate-400 text-xs">-</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === "registrar" && (
        <div className="w-full space-y-6">
          {sucessoFeedback ? (
            <div className="p-8 text-center space-y-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-base font-extrabold text-slate-900">Entrada Confirmada!</p>
              <p className="text-xs text-slate-500">O saldo foi somado ao inventário e registrado no histórico.</p>
            </div>
          ) : (
            <div className="w-full space-y-5">
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
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setArquivoFotoReal(file);
                                setFotoMercadoria(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {erroEntrada && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                      {erroEntrada}
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={limparSelecao}
                      disabled={salvandoEntrada}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      Limpar
                    </button>

                    <button
                      type="button"
                      onClick={handleSalvarEntrada}
                      disabled={salvandoEntrada}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{salvandoEntrada ? "Registrando no estoque..." : "Salvar Entrada no Estoque"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200/80 rounded-xl">
                  Selecione um insumo acima para abrir os campos de registro.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {abaAtiva === "extrato" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase text-slate-600 tracking-wide">
              Registros Cronológicos de Movimentação
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
            {carregandoExtrato ? (
               <div className="p-6 text-center text-xs text-slate-400 font-medium animate-pulse">
                Sincronizando histórico de auditoria com o banco de dados...
              </div>
            ) : extrato.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma movimentação registrada nesta sessão.
              </div>
            ) : (
              extrato.map((mov) => {
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
                          isEntrada ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isEntrada ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 truncate">{mov.origemTurno}</p>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              isEntrada ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {isEntrada ? "ENTRADA" : "SAÍDA"}
                          </span>
                        </div>

                        <p className="text-slate-500 text-xs truncate">{mov.itensResumo}</p>
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
              })
            )}
          </div>
        </div>
      )}

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
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Tipo / Turno</span>
                <span className="font-extrabold text-slate-800">{itemAuditoriaSelecionado.origemTurno}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Responsável</span>
                <span className="font-semibold text-slate-800">{itemAuditoriaSelecionado.responsavel}</span>
              </div>

              {itemAuditoriaSelecionado.fornecedor && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Fornecedor / Origem</span>
                  <span className="font-medium text-slate-700">{itemAuditoriaSelecionado.fornecedor}</span>
                </div>
              )}

              {itemAuditoriaSelecionado.lote && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Lote / Validade</span>
                  <span className="font-medium text-slate-700">{itemAuditoriaSelecionado.lote}</span>
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
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">Ocorrências</span>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-relaxed">
                  {itemAuditoriaSelecionado.observacao}
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                Comprovante / Anexo
              </span>
              {carregandoFotoAuditoria ? (
                <div className="p-4 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-xl animate-pulse">
                  Buscando anexo no servidor...
                </div>
              ) : fotoAuditoria ? (
                <div>
                  <a 
                    href={fotoAuditoria} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="block border border-slate-200 rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                    title="Clique para expandir"
                  >
                    <img src={fotoAuditoria} alt="Comprovante" className="w-full h-36 object-cover" />
                  </a>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">Clique na imagem para ampliar</p>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                  Nenhum comprovante anexado a este registro.
                </div>
              )}
            </div>

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