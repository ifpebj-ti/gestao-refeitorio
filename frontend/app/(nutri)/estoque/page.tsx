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
  Plus,
  Edit2,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  DollarSign,
  Calendar,
  MapPin,
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
  localArmazenamento?: string;
  lote?: string;
  validade?: string;
  valor?: number;
  saldoAtual?: number;
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
  const { autenticado, carregando, perfil, usuario } = useAuth();

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
  const [origemEntrada, setOrigemEntrada] = useState<"EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA">("AGROPECUARIA");
  const [fornecedorEntrada, setFornecedorEntrada] = useState("Agropecuária (Fazenda IFPE)");
  const [quantidadeEntrada, setQuantidadeEntrada] = useState("");
  const [validadeEntrada, setValidadeEntrada] = useState("");
  const [loteEntrada, setLoteEntrada] = useState("");
  const [fotoMercadoria, setFotoMercadoria] = useState<string | null>(null);
  const [arquivoFotoReal, setArquivoFotoReal] = useState<File | null>(null);
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);
  const [erroEntrada, setErroEntrada] = useState<string | null>(null);
  const [sucessoFeedback, setSucessoFeedback] = useState(false);

  // Estados para Novo Insumo (US04 / #174)
  const [modalNovoInsumoAberto, setModalNovoInsumoAberto] = useState(false);
  const [novoInsumoNome, setNovoInsumoNome] = useState("");
  const [novoInsumoCategoria, setNovoInsumoCategoria] = useState("Proteínas & Frios");
  const [novoInsumoUnidade, setNovoInsumoUnidade] = useState("KG");
  const [novoInsumoValor, setNovoInsumoValor] = useState("");
  const [novoInsumoOrigem, setNovoInsumoOrigem] = useState<"EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA">("AGROPECUARIA");
  const [novoInsumoFornecedor, setNovoInsumoFornecedor] = useState("Agropecuária (Fazenda IFPE)");
  const [novoInsumoDarEntradaInicial, setNovoInsumoDarEntradaInicial] = useState(false);
  const [novoInsumoQtdInicial, setNovoInsumoQtdInicial] = useState("");
  const [novoInsumoValidadeInicial, setNovoInsumoValidadeInicial] = useState("");
  const [salvandoNovoInsumo, setSalvandoNovoInsumo] = useState(false);
  const [erroNovoInsumo, setErroNovoInsumo] = useState<string | null>(null);

  // Estados para Edição de Insumo (US05 / #174)
  const [modalEdicaoInsumoAberto, setModalEdicaoInsumoAberto] = useState(false);
  const [insumoEmEdicao, setInsumoEmEdicao] = useState<ProdutoResponse | null>(null);
  const [edicaoUnidade, setEdicaoUnidade] = useState("KG");
  const [edicaoQtdMinima, setEdicaoQtdMinima] = useState("");
  const [edicaoValorReferencia, setEdicaoValorReferencia] = useState("");
  const [edicaoValidadeControlada, setEdicaoValidadeControlada] = useState(false);
  const [salvandoEdicaoInsumo, setSalvandoEdicaoInsumo] = useState(false);
  const [erroEdicaoInsumo, setErroEdicaoInsumo] = useState<string | null>(null);

  // Feedback geral de sucesso
  const [sucessoGeral, setSucessoGeral] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const abrirModalNovoInsumo = () => {
    setNovoInsumoNome("");
    setNovoInsumoCategoria("Proteínas & Frios");
    setNovoInsumoUnidade("KG");
    setNovoInsumoValor("");
    setNovoInsumoOrigem("AGROPECUARIA");
    setNovoInsumoFornecedor("Agropecuária (Fazenda IFPE)");
    setNovoInsumoDarEntradaInicial(false);
    setNovoInsumoQtdInicial("");
    setNovoInsumoValidadeInicial("");
    setErroNovoInsumo(null);
    setModalNovoInsumoAberto(true);
  };

  const handleSalvarNovoInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoInsumoNome.trim()) {
      setErroNovoInsumo("O nome do insumo é obrigatório.");
      return;
    }
    const valorNumerico = parseFloat(novoInsumoValor.replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErroNovoInsumo("Informe um valor de referência positivo (ex: 25.50).");
      return;
    }

    setSalvandoNovoInsumo(true);
    setErroNovoInsumo(null);
    try {
      const novoProduto = await produtoService.cadastrar({
        nome: novoInsumoNome.trim(),
        categoria: novoInsumoCategoria,
        unidadeMedida: novoInsumoUnidade,
        valorReferencia: valorNumerico,
      });

      // Se optou por lançar entrada inicial no estoque:
      if (novoInsumoDarEntradaInicial && novoInsumoQtdInicial.trim()) {
        const qtdInicialNum = parseFloat(novoInsumoQtdInicial.replace(",", "."));
        if (!isNaN(qtdInicialNum) && qtdInicialNum > 0) {
          const LOCAL_CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";
          const LOCAL_DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";
          const localId = novoInsumoCategoria === "Proteínas & Frios" ? LOCAL_CONGELADOS : LOCAL_DESPENSA;
          const hojeIso = new Date().toISOString().split("T")[0];

          const resEntrada = await registrarEntradaApi({
            produtoId: novoProduto.id,
            localId,
            quantidade: qtdInicialNum,
            data: hojeIso,
            origem: novoInsumoOrigem,
            valor: Number((qtdInicialNum * valorNumerico).toFixed(2)),
            dataValidade: novoInsumoValidadeInicial || undefined,
            fornecedor: novoInsumoFornecedor.trim() || undefined,
          });

          if (resEntrada?.id && novoInsumoFornecedor.trim()) {
            try {
              localStorage.setItem(`@gestao_refeitorio:mov_fornecedor_${resEntrada.id}`, novoInsumoFornecedor.trim());
            } catch (e) {}
          }
        }
      }

      setModalNovoInsumoAberto(false);
      setSucessoGeral(`Insumo "${novoInsumoNome}" cadastrado com sucesso no estoque!`);
      setTimeout(() => setSucessoGeral(null), 4000);
      await carregarProdutos();
      if (abaAtiva === "extrato") {
        await carregarHistorico();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar insumo.";
      setErroNovoInsumo(msg);
    } finally {
      setSalvandoNovoInsumo(false);
    }
  };

  const abrirModalEdicaoInsumo = (item: ProdutoResponse) => {
    setInsumoEmEdicao(item);
    setEdicaoUnidade(item.unidadeMedida || "KG");
    setEdicaoQtdMinima(
      item.quantidadeMinima !== undefined && item.quantidadeMinima !== null
        ? String(item.quantidadeMinima)
        : ""
    );
    setEdicaoValorReferencia(
      item.valorReferencia !== undefined && item.valorReferencia !== null
        ? String(item.valorReferencia)
        : ""
    );
    setEdicaoValidadeControlada(Boolean(item.controlaValidade));
    setErroEdicaoInsumo(null);
    setModalEdicaoInsumoAberto(true);
  };

  const handleSalvarEdicaoInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoEmEdicao) return;

    setSalvandoEdicaoInsumo(true);
    setErroEdicaoInsumo(null);
    try {
      if (edicaoUnidade !== insumoEmEdicao.unidadeMedida) {
        await produtoService.atualizarUnidadeMedida(insumoEmEdicao.id, edicaoUnidade);
      }

      if (edicaoQtdMinima.trim() !== "") {
        const qtdMin = parseFloat(edicaoQtdMinima.replace(",", "."));
        if (!isNaN(qtdMin) && qtdMin >= 0) {
          await produtoService.atualizarQuantidadeMinima(insumoEmEdicao.id, qtdMin);
        }
      }

      if (edicaoValorReferencia.trim() !== "") {
        const valRef = parseFloat(edicaoValorReferencia.replace(",", "."));
        if (!isNaN(valRef) && valRef > 0 && valRef !== insumoEmEdicao.valorReferencia) {
          await produtoService.atualizarValorReferencia(insumoEmEdicao.id, valRef);
        }
      }

      if (edicaoValidadeControlada !== Boolean(insumoEmEdicao.controlaValidade)) {
        await produtoService.atualizarControleValidade(
          insumoEmEdicao.id,
          edicaoValidadeControlada
        );
      }

      setModalEdicaoInsumoAberto(false);
      setSucessoGeral(`Insumo "${insumoEmEdicao.nome}" atualizado com sucesso!`);
      setTimeout(() => setSucessoGeral(null), 4000);
      await carregarProdutos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar insumo.";
      setErroEdicaoInsumo(msg);
    } finally {
      setSalvandoEdicaoInsumo(false);
    }
  };

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
            const dataObj = new Date(mov.data + "T00:00:00");
            if (!isNaN(dataObj.getTime())) {
              dataFormatada = dataObj.toLocaleDateString("pt-BR");
            }
          }
        } catch (e) {}

        const produtoObj = listaEstoque.find(p => p.id === mov.produtoId);
        const nomeInsumo = mov.produtoNome || produtoObj?.nome || "Insumo";
        const unidade = produtoObj?.unidadeMedida || "un";
        const localNome = mov.localNome || "Despensa Geral";

        let origemFormatada = "IFPE";
        if (mov.origem === "EXTERNA") origemFormatada = "Fornecedor Externo";
        else if (mov.origem === "AGROINDUSTRIA") origemFormatada = "Agroindústria (IFPE)";
        else if (mov.origem === "AGROPECUARIA") origemFormatada = "Agropecuária (IFPE)";
        else if (mov.origem === "INTERNA") origemFormatada = "Produção Interna";

        // Recupera fornecedor personalizado se foi digitado no momento do registro
        const fornecedorSalvo = typeof window !== "undefined" ? localStorage.getItem(`@gestao_refeitorio:mov_fornecedor_${mov.id}`) : null;
        const fornecedorFinal = fornecedorSalvo || origemFormatada;

        let saidaFormatada = "Consumo";
        if (mov.tipoSaida === "CONSUMO") saidaFormatada = "Consumo das Refeições";
        else if (mov.tipoSaida === "PERDA") saidaFormatada = "Perda Registrada";
        else if (mov.tipoSaida === "DESCARTE") saidaFormatada = "Descarte por Validade";
        else if (mov.tipoSaida === "OUTRO") saidaFormatada = "Outra Saída";

        let validadeFormatada: string | undefined = undefined;
        if (mov.dataValidade) {
          try {
            const vObj = new Date(mov.dataValidade + "T00:00:00");
            validadeFormatada = vObj.toLocaleDateString("pt-BR");
          } catch {
            validadeFormatada = mov.dataValidade;
          }
        }

        // Responsável real que executou a ação no sistema
        let responsavelFormatado = "Equipe do Refeitório";
        if (mov.responsavelNome) {
          responsavelFormatado = mov.responsavelPerfil
            ? `${mov.responsavelNome} (${mov.responsavelPerfil === 'NUTRICIONISTA' ? 'Nutricionista' : 'Cozinha'})`
            : mov.responsavelNome;
        } else if (mov.responsavelPerfil) {
          responsavelFormatado = mov.responsavelPerfil === 'NUTRICIONISTA' ? 'Nutricionista (Setor de Nutrição)' : 'Cozinha (Operacional)';
        } else if (usuario?.nome && mov.tipo === "ENTRADA") {
          responsavelFormatado = `${usuario.nome} (${perfil === 'NUTRICIONISTA' ? 'Nutricionista' : 'Cozinha'})`;
        } else if (perfil === "NUTRICIONISTA" && mov.tipo === "ENTRADA") {
          responsavelFormatado = "Nutricionista (Setor de Nutrição)";
        }

        // Saldo atual real
        const saldoReal = (mov.saldoAtual !== undefined && mov.saldoAtual !== null && mov.saldoAtual > 0)
          ? mov.saldoAtual
          : (produtoObj?.saldoTotal !== undefined && produtoObj.saldoTotal > 0 ? produtoObj.saldoTotal : mov.quantidade);

        return {
          id: mov.id,
          tipo: mov.tipo,
          dataHora: dataFormatada,
          origemTurno: mov.tipo === "ENTRADA" ? `Entrada • ${fornecedorFinal}` : `Saída • ${saidaFormatada}`,
          responsavel: responsavelFormatado, 
          fornecedor: mov.tipo === "ENTRADA" ? fornecedorFinal : undefined,
          localArmazenamento: localNome,
          validade: validadeFormatada,
          valor: mov.valor,
          saldoAtual: saldoReal,
          itensResumo: `${nomeInsumo} (${mov.tipo === 'ENTRADA' ? '+' : '-'}${mov.quantidade} ${unidade})`,
          detalhesItens: [
            {
              insumo: nomeInsumo,
              quantidade: mov.quantidade,
              unidade: unidade,
            },
          ],
          observacao: mov.tipo === "ENTRADA" 
            ? `Entrada recebida de ${fornecedorFinal} e armazenada em ${localNome}.` 
            : `Saída de insumos registrada via sistema (${saidaFormatada}).`,
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

  const itensFiltrados = listaEstoque
    .filter((item) => {
      const bateCategoria = categoriaFiltro === "Todos" || item.categoria === categoriaFiltro;
      const bateBusca = busca.trim() === "" || item.nome.toLowerCase().includes(busca.toLowerCase());
      return bateCategoria && bateBusca;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const insumosEntradaFiltrados = listaEstoque
    .filter((item) => {
      const bateCategoria = categoriaEntradaAtiva === "Todos" || item.categoria === categoriaEntradaAtiva;
      const bateBusca = buscaEntrada.trim() === "" || item.nome.toLowerCase().includes(buscaEntrada.toLowerCase());
      return bateCategoria && bateBusca;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

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
    setOrigemEntrada("AGROPECUARIA");
    setFornecedorEntrada("Agropecuária (Fazenda IFPE)");
    setQuantidadeEntrada("");
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

    const ehAgropec = origemEntrada === "AGROPECUARIA" || fornecedorEntrada.toLowerCase().includes("agropec");
    const ehAgroind = origemEntrada === "AGROINDUSTRIA" || fornecedorEntrada.toLowerCase().includes("agroind");
    const origemFinal: "EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA" = ehAgropec
      ? "AGROPECUARIA"
      : ehAgroind
      ? "AGROINDUSTRIA"
      : origemEntrada;

    const precoUnitario =
      insumoEntradaSelecionado.valorReferencia && insumoEntradaSelecionado.valorReferencia > 0
        ? insumoEntradaSelecionado.valorReferencia
        : 10.0;
    const valorTotal = Number((qtdNum * precoUnitario).toFixed(2));

    const hojeIso = new Date().toISOString().split("T")[0];

    try {
      setSalvandoEntrada(true);
      setErroEntrada(null);

      const res = await registrarEntradaApi(
        {
          produtoId: insumoEntradaSelecionado.id,
          localId,
          quantidade: qtdNum,
          data: hojeIso,
          origem: origemFinal,
          valor: valorTotal,
          dataValidade: validadeEntrada || undefined,
          fornecedor: fornecedorEntrada.trim() || undefined,
        },
        arquivoFotoReal
      );

      // Salva o fornecedor digitado associado ao ID da movimentação
      if (res?.id && fornecedorEntrada.trim()) {
        try {
          localStorage.setItem(`@gestao_refeitorio:mov_fornecedor_${res.id}`, fornecedorEntrada.trim());
        } catch (e) {}
      }

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

        <button
          type="button"
          onClick={abrirModalNovoInsumo}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Insumo</span>
        </button>
      </div>

      {sucessoGeral && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{sucessoGeral}</span>
        </div>
      )}

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
                      <div className="flex items-center gap-2">
                        {isAtencao ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                            Atenção
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                            Normal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => abrirModalEdicaoInsumo(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar parâmetros do insumo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2 flex-wrap">
                      <div>
                        <span className="text-slate-500 font-medium">Preço Ref.: </span>
                        <span className="font-bold text-emerald-800">
                          R$ {Number(item.valorReferencia || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Qtd. Mín: </span>
                        <span className="font-bold text-slate-700">
                          {item.quantidadeMinima ?? 0} {item.unidadeMedida}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 font-medium">Saldo: </span>
                        <span className="text-sm font-black text-slate-900">
                          {item.saldoTotal ?? 0} <span className="text-[11px] font-semibold text-slate-600">{item.unidadeMedida}</span>
                        </span>
                      </div>
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
                  <th className="px-4 py-3 text-right">Preço Ref.</th>
                  <th className="px-4 py-3 text-right">Qtd. Mínima</th>
                  <th className="px-4 py-3 text-right">Saldo Atual</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {carregandoProdutos ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                      Carregando produtos do estoque...
                    </td>
                  </tr>
                ) : erroCarregamento ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-rose-600 font-medium">
                      {erroCarregamento}
                    </td>
                  </tr>
                ) : itensFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
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
                        <td className="px-4 py-3 text-right text-emerald-800 font-bold">
                          R$ {Number(item.valorReferencia || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 font-medium">
                          {item.quantidadeMinima ?? 0} {item.unidadeMedida}
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
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => abrirModalEdicaoInsumo(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer"
                            title="Editar parâmetros do insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
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

      {abaAtiva === "registrar" && (
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {sucessoFeedback ? (
            <div className="p-8 text-center space-y-2 bg-white border border-slate-200 rounded-3xl shadow-xs animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-base font-extrabold text-slate-900">Entrada Confirmada com Sucesso!</p>
              <p className="text-xs text-slate-500">O saldo foi somado ao inventário e registrado na auditoria.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-emerald-600" />
                  <span>Lançar Entrada no Estoque</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione o insumo já existente no catálogo e informe a quantidade recebida para somar ao saldo.
                </p>
              </div>

              {/* 1. Seleção do Insumo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                  <span>Insumo a Receber *</span>
                  {insumoEntradaSelecionado && (
                    <span className="text-[11px] font-semibold text-emerald-700 lowercase">
                      Saldo em estoque: {insumoEntradaSelecionado.saldoTotal ?? 0} {insumoEntradaSelecionado.unidadeMedida}
                    </span>
                  )}
                </label>
                <select
                  value={itemEntradaId}
                  onChange={(e) => {
                    const item = listaEstoque.find((i) => i.id === e.target.value);
                    if (item) {
                      setItemEntradaId(item.id);
                    } else {
                      limparSelecao();
                    }
                  }}
                  className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                >
                  <option value="">Selecione o insumo recebido...</option>
                  {listaEstoque.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} — {i.categoria} [{i.unidadeMedida}]
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Origem e Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Canal / Origem da Mercadoria *
                  </label>
                  <select
                    value={origemEntrada}
                    onChange={(e) => {
                      const novaOrigem = e.target.value as "EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA";
                      setOrigemEntrada(novaOrigem);
                      if (novaOrigem === "AGROPECUARIA") {
                        setFornecedorEntrada("Agropecuária (Fazenda IFPE)");
                      } else if (novaOrigem === "AGROINDUSTRIA") {
                        setFornecedorEntrada("Agroindústria (IFPE)");
                      } else if (novaOrigem === "EXTERNA") {
                        setFornecedorEntrada("Fornecedor Externo");
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="AGROPECUARIA">Agropecuária / Fazenda (IFPE)</option>
                    <option value="AGROINDUSTRIA">Agroindústria (IFPE)</option>
                    <option value="EXTERNA">Fornecedor Externo (Compras/Licitação)</option>
                    <option value="INTERNA">Produção Interna</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Nome do Fornecedor / Setor *</span>
                  </label>
                  <input
                    type="text"
                    list="sugestoes-fornecedor-nutri"
                    value={fornecedorEntrada}
                    onChange={(e) => setFornecedorEntrada(e.target.value)}
                    placeholder="Ex.: Agropecuária IFPE, Cooperativa, Distribuidora..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  />
                  <datalist id="sugestoes-fornecedor-nutri">
                    <option value="Agropecuária (Fazenda IFPE)" />
                    <option value="Agroindústria (IFPE)" />
                    <option value="Distribuidora Agreste" />
                    <option value="Cooperativa da Agricultura Familiar" />
                    <option value="Fornecedor Externo / Licitação" />
                  </datalist>
                </div>
              </div>

              {/* 3. Quantidade e Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Quantidade Recebida {insumoEntradaSelecionado ? `(${insumoEntradaSelecionado.unidadeMedida})` : ""} *
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

                <div className="space-y-1.5">
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
              </div>

              {/* 4. Lote e Foto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Número do Lote (opcional)
                  </label>
                  <input
                    type="text"
                    value={loteEntrada}
                    onChange={(e) => setLoteEntrada(e.target.value)}
                    placeholder="Ex: LT-2026-04"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Foto / Canhoto (Opcional)</span>
                  </label>
                  <div className="border border-slate-300 rounded-xl p-2 text-center hover:bg-slate-50 transition-colors">
                    {fotoMercadoria ? (
                      <div className="flex items-center justify-between text-xs text-emerald-800 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-2 truncate">
                          <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">Foto anexada</span>
                        </div>
                        <button
                          type="button"
                          onClick={removerFoto}
                          className="text-slate-400 hover:text-slate-700 underline text-[11px] cursor-pointer ml-2"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 py-0.5">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span>Fotografar ou anexar canhoto</span>
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
              </div>

              {erroEntrada && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {erroEntrada}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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
                  disabled={salvandoEntrada || !itemEntradaId || !quantidadeEntrada || parseFloat(quantidadeEntrada) <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {salvandoEntrada ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{salvandoEntrada ? "Registrando no estoque..." : "Salvar Entrada no Estoque"}</span>
                </button>
              </div>
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
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Tipo / Operação</span>
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

              {itemAuditoriaSelecionado.localArmazenamento && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Armazenamento</span>
                  <span className="font-medium text-slate-700">{itemAuditoriaSelecionado.localArmazenamento}</span>
                </div>
              )}

              {itemAuditoriaSelecionado.validade && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Validade</span>
                  <span className="font-semibold text-slate-800">{itemAuditoriaSelecionado.validade}</span>
                </div>
              )}

              {itemAuditoriaSelecionado.lote && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Lote</span>
                  <span className="font-medium text-slate-700">{itemAuditoriaSelecionado.lote}</span>
                </div>
              )}

              {itemAuditoriaSelecionado.valor !== undefined && itemAuditoriaSelecionado.valor !== null && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Valor Total</span>
                  <span className="font-semibold text-emerald-700">R$ {Number(itemAuditoriaSelecionado.valor).toFixed(2)}</span>
                </div>
              )}

              {itemAuditoriaSelecionado.saldoAtual !== undefined && itemAuditoriaSelecionado.saldoAtual !== null && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Saldo Resultante</span>
                  <span className="font-bold text-slate-900">{itemAuditoriaSelecionado.saldoAtual}</span>
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
      {/* Modal de Cadastro de Novo Insumo */}
      {modalNovoInsumoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Cadastrar Novo Insumo
                  </h3>
                  <p className="text-[11px] text-slate-400">Adicione ao catálogo de estoque do refeitório</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoInsumoAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoInsumo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Nome do Insumo *
                </label>
                <input
                  type="text"
                  required
                  value={novoInsumoNome}
                  onChange={(e) => setNovoInsumoNome(e.target.value)}
                  placeholder="Ex: Carne de Porco, Arroz Parboilizado..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Categoria *
                  </label>
                  <select
                    value={novoInsumoCategoria}
                    onChange={(e) => setNovoInsumoCategoria(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {CATEGORIAS.filter((c) => c !== "Todos").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Unidade de Medida *
                  </label>
                  <select
                    value={novoInsumoUnidade}
                    onChange={(e) => setNovoInsumoUnidade(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="KG">Quilograma (KG)</option>
                    <option value="L">Litro (L)</option>
                    <option value="UN">Unidade (UN)</option>
                    <option value="PACOTE">Pacote</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Preço Referência Unitário (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={novoInsumoValor}
                    onChange={(e) => setNovoInsumoValor(e.target.value)}
                    placeholder="25.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Origem / Fornecimento
                  </label>
                  <select
                    value={novoInsumoOrigem}
                    onChange={(e) => {
                      const novaOrigem = e.target.value as "EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA";
                      setNovoInsumoOrigem(novaOrigem);
                      if (novaOrigem === "AGROPECUARIA") {
                        setNovoInsumoFornecedor("Agropecuária (Fazenda IFPE)");
                      } else if (novaOrigem === "AGROINDUSTRIA") {
                        setNovoInsumoFornecedor("Agroindústria (IFPE)");
                      } else if (novaOrigem === "EXTERNA") {
                        setNovoInsumoFornecedor("Fornecedor Externo");
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="AGROPECUARIA">Agropecuária / Fazenda (IFPE)</option>
                    <option value="AGROINDUSTRIA">Agroindústria (IFPE)</option>
                    <option value="EXTERNA">Fornecedor Externo</option>
                    <option value="INTERNA">Produção Interna</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Fornecedor / Cooperativa
                  </label>
                  <input
                    type="text"
                    list="sugestoes-fornecedor-novo-insumo"
                    value={novoInsumoFornecedor}
                    onChange={(e) => setNovoInsumoFornecedor(e.target.value)}
                    placeholder="Ex: Agropecuária IFPE, Cooperativa..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                  <datalist id="sugestoes-fornecedor-novo-insumo">
                    <option value="Agropecuária (Fazenda IFPE)" />
                    <option value="Agroindústria (IFPE)" />
                    <option value="Distribuidora Agreste" />
                    <option value="Cooperativa da Agricultura Familiar" />
                    <option value="Fornecedor Externo / Licitação" />
                  </datalist>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-950 block">
                      Dar Entrada Inicial no Estoque
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      Cadastra o insumo e já registra a primeira carga recebida.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={novoInsumoDarEntradaInicial}
                    onChange={(e) => setNovoInsumoDarEntradaInicial(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {novoInsumoDarEntradaInicial && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-900 uppercase">
                        Qtd. Recebida ({novoInsumoUnidade}) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={novoInsumoQtdInicial}
                        onChange={(e) => setNovoInsumoQtdInicial(e.target.value)}
                        placeholder="Ex: 50"
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-900 uppercase">
                        Validade (Opcional)
                      </label>
                      <input
                        type="date"
                        value={novoInsumoValidadeInicial}
                        onChange={(e) => setNovoInsumoValidadeInicial(e.target.value)}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {erroNovoInsumo && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroNovoInsumo}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovoInsumoAberto(false)}
                  disabled={salvandoNovoInsumo}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoNovoInsumo}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvandoNovoInsumo && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{salvandoNovoInsumo ? "Cadastrando..." : "Cadastrar Insumo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Insumo */}
      {modalEdicaoInsumoAberto && insumoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Editar Parâmetros
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                    {insumoEmEdicao.nome} ({insumoEmEdicao.categoria})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEdicaoInsumoAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoInsumo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Unidade de Medida
                </label>
                <select
                  value={edicaoUnidade}
                  onChange={(e) => setEdicaoUnidade(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="KG">Quilograma (KG)</option>
                  <option value="L">Litro (L)</option>
                  <option value="UN">Unidade (UN)</option>
                  <option value="PACOTE">Pacote</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Preço de Referência Unitário (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={edicaoValorReferencia}
                    onChange={(e) => setEdicaoValorReferencia(e.target.value)}
                    placeholder="Ex: 25.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Preço médio de mercado por {edicaoUnidade} para cálculo de custo de entradas e relatórios.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Quantidade Mínima de Segurança ({edicaoUnidade})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={edicaoQtdMinima}
                  onChange={(e) => setEdicaoQtdMinima(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-400">
                  O sistema alertará quando o saldo total estiver abaixo deste valor.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    Controle Rigoroso de Validade
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    Exigido para proteínas, frios e laticínios perecíveis.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={edicaoValidadeControlada}
                  onChange={(e) => setEdicaoValidadeControlada(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {erroEdicaoInsumo && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroEdicaoInsumo}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEdicaoInsumoAberto(false)}
                  disabled={salvandoEdicaoInsumo}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicaoInsumo}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvandoEdicaoInsumo && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{salvandoEdicaoInsumo ? "Salvando..." : "Salvar Alterações"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}