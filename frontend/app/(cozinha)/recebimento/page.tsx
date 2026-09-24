"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  PackagePlus,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  AlertCircle,
  Building2,
  Loader2,
  X,
  Upload,
  ImageIcon,
} from "lucide-react";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import { registrarEntradaApi } from "@/lib/movimentacoes";

interface ItemRecebido {
  idTemp: string;
  produtoId: string;
  nome: string;
  fornecedor: string;
  quantidade: number;
  unidade: string;
  valorReferencia?: number;
  dataValidade?: string;
  lote?: string;
  fotoPreview?: string;
  arquivoFoto?: File;
  categoria: string;
}

const CATEGORIAS = [
  "Todos",
  "Grãos & Cereais",
  "Proteínas & Frios",
  "Hortifrúti",
  "Laticínios",
  "Especificações & Condimentos",
] as const;

export default function RecebimentoCozinhaPage() {
  const [dataEntrega, setDataEntrega] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoResponse[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);

  const [itensRecebidos, setItensRecebidos] = useState<ItemRecebido[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [feedbackSucesso, setFeedbackSucesso] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // Filtros de seleção
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todos");
  const [busca, setBusca] = useState("");
  const [buscaFocada, setBuscaFocada] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoResponse | null>(null);

  // Campos do formulário
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [dataValidade, setDataValidade] = useState("");
  const [lote, setLote] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function carregarCatalogo() {
      try {
        setCarregandoProdutos(true);
        const dados = await produtoService.listar();
        setProdutosDisponiveis(dados);
      } catch (err: any) {
        console.error("Erro ao carregar lista de insumos:", err);
        if (err?.response?.status === 401) {
          setErroEnvio(
            "Sessão não autenticada ou expirada. Clique em 'Área do Nutricionista' na barra lateral para autenticar com sua conta institucional."
          );
        } else {
          setErroEnvio("Não foi possível carregar os insumos do estoque.");
        }
      } finally {
        setCarregandoProdutos(false);
      }
    }
    carregarCatalogo();
  }, []);

  const produtosFiltrados = produtosDisponiveis.filter((item) => {
    const bateCategoria =
      categoriaAtiva === "Todos" || item.categoria === categoriaAtiva;
    const bateBusca =
      busca.trim() === "" ||
      item.nome.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivoFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const removerFoto = () => {
    setFotoPreview(null);
    setArquivoFoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const alternarSelecaoInsumo = (item: ProdutoResponse) => {
    if (produtoSelecionado?.id === item.id) {
      limparSelecao();
    } else {
      setProdutoSelecionado(item);
      setBusca(item.nome);
      setBuscaFocada(false);
    }
  };

  const limparSelecao = () => {
    setProdutoSelecionado(null);
    setBusca("");
    setQuantidade("");
    setDataValidade("");
    setLote("");
    removerFoto();
  };

  const adicionarItem = () => {
    if (!produtoSelecionado) return;
    const qtdNum = parseFloat(quantidade);
    if (isNaN(qtdNum) || qtdNum <= 0) return;
    if (!fornecedor.trim()) return;

    const novoItem: ItemRecebido = {
      idTemp: Math.random().toString(),
      produtoId: produtoSelecionado.id,
      nome: produtoSelecionado.nome,
      fornecedor: fornecedor.trim(),
      quantidade: qtdNum,
      unidade: produtoSelecionado.unidadeMedida,
      valorReferencia: produtoSelecionado.valorReferencia,
      dataValidade: dataValidade || undefined,
      lote: lote.trim() || undefined,
      fotoPreview: fotoPreview || undefined,
      arquivoFoto: arquivoFoto || undefined,
      categoria: produtoSelecionado.categoria,
    };

    setItensRecebidos((prev) => [novoItem, ...prev]);
    limparSelecao();
  };

  const removerItem = (idTemp: string) => {
    setItensRecebidos((prev) => prev.filter((item) => item.idTemp !== idTemp));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itensRecebidos.length === 0) return;

    const LOCAL_CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";
    const LOCAL_DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";

    try {
      setSalvando(true);
      setErroEnvio(null);

      for (const item of itensRecebidos) {
        const ehRefrigerado =
          item.categoria === "Proteínas & Frios" ||
          item.categoria === "Laticínios" ||
          item.categoria.toLowerCase().includes("frio") ||
          item.categoria.toLowerCase().includes("laticínio") ||
          item.categoria.toLowerCase().includes("laticinio");
        const localId = ehRefrigerado ? LOCAL_CONGELADOS : LOCAL_DESPENSA;

        const ehAgro = item.fornecedor.toLowerCase().includes("agro");
        const origem = ehAgro ? "AGROINDUSTRIA" : "EXTERNA";
        const valorUnitario = item.valorReferencia && item.valorReferencia > 0 ? item.valorReferencia : 10;

        await registrarEntradaApi(
          {
            produtoId: item.produtoId,
            localId,
            quantidade: item.quantidade,
            data: dataEntrega,
            origem,
            valor: Number((item.quantidade * valorUnitario).toFixed(2)),
          },
          item.arquivoFoto
        );
      }

      setFeedbackSucesso(true);
      setItensRecebidos([]);
      setFornecedor("");

      setTimeout(() => {
        setFeedbackSucesso(false);
      }, 3500);
    } catch (err: any) {
      console.error("Erro ao registrar recebimento:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Não foi possível registrar a entrada dos insumos no estoque.";
      setErroEnvio(msg);
    } finally {
      setSalvando(false);
    }
  };

  const podeIncluir =
    produtoSelecionado &&
    fornecedor.trim().length > 0 &&
    Boolean(quantidade) &&
    parseFloat(quantidade) > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recebimento de Insumos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lance e confira os itens recebidos dos fornecedores para entrada no estoque.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 border border-slate-300 rounded-xl shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <input
            type="date"
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
            className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {feedbackSucesso && (
        <div className="p-4 sm:p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">Entrada registrada com sucesso!</p>
            <p className="text-xs text-emerald-100">
              O estoque foi incrementado e o registro de recebimento foi salvo no banco.
            </p>
          </div>
        </div>
      )}

      {erroEnvio && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{erroEnvio}</span>
        </div>
      )}

      {/* 2. Card de Seleção de Insumos (Estilo Nutri) */}
      <div className="bg-emerald-50/50 border-2 border-emerald-200/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-600" />
            <span>Selecionar Insumo ({produtosFiltrados.length} encontrados)</span>
          </h2>

          {produtoSelecionado && (
            <div className="flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <span>Selecionado: {produtoSelecionado.nome}</span>
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

        {/* Abas das Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${categoriaAtiva === cat
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Campo de Busca com Botão de Limpar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onFocus={() => setBuscaFocada(true)}
            onChange={(e) => {
              setBusca(e.target.value);
              setBuscaFocada(true);
            }}
            placeholder="Digite o nome do insumo ou escolha abaixo..."
            className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
          />

          {busca.length > 0 && (
            <button
              type="button"
              onClick={limparSelecao}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {buscaFocada && busca.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border-2 border-emerald-400 rounded-xl shadow-xl z-30 divide-y divide-slate-100">
              {produtosFiltrados.length === 0 ? (
                <div className="p-3 text-xs text-slate-400 text-center font-medium">
                  Nenhum produto encontrado com &quot;{busca}&quot;
                </div>
              ) : (
                produtosFiltrados.map((item) => (
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

        {/* Chips com suporte a toggle/desmarcar */}
        {carregandoProdutos ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Carregando catálogo de insumos...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
            {produtosFiltrados.map((item) => {
              const selecionado = produtoSelecionado?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => alternarSelecaoInsumo(item)}
                  className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${selecionado
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
        )}

        {/* Seletor Dropdown Alternativo (idêntico ao Nutri) */}
        {!produtoSelecionado && (
          <div className="pt-3 border-t border-emerald-200/80 animate-in fade-in duration-150">
            <label className="text-[11px] font-bold text-emerald-950 uppercase block mb-1">
              Ou selecione diretamente no seletor completo:
            </label>
            <select
              value=""
              onChange={(e) => {
                const item = produtosDisponiveis.find((i: ProdutoResponse) => i.id === e.target.value);
                if (item) {
                  alternarSelecaoInsumo(item);
                } else {
                  limparSelecao();
                }
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">-- Nenhum insumo selecionado --</option>
              {produtosDisponiveis.map((i: ProdutoResponse) => (
                <option key={i.id} value={i.id}>
                  {i.nome} ({i.categoria} • {i.unidadeMedida})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. Formulário de Dados com Dropzone de Anexo */}
      {produtoSelecionado ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Dados do Recebimento: {produtoSelecionado.nome}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Unidade: <strong className="text-emerald-700">{produtoSelecionado.unidadeMedida}</strong>
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Fornecedor / Origem da Entrega *</span>
            </label>
            <input
              type="text"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Ex.: Distribuidora Agreste, Agropecuária..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Quantidade Recebida ({produtoSelecionado.unidadeMedida}) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
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
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Número do Lote (opcional)
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ex.: LT-2026"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Dropzone de Foto idêntico ao do Nutri */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Foto do Produto / Canhoto (Opcional)</span>
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50/50 transition-colors">
              {fotoPreview ? (
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
                    onChange={handleFotoChange}
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
              type="button"
              onClick={adicionarItem}
              disabled={!podeIncluir}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Incluir na Entrada</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200/80 rounded-xl">
          Selecione um insumo acima para abrir os campos de registro.
        </div>
      )}

      {/* 4. Lista de Itens Conferidos e Gravação */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide">
              Itens para Registrar Entrada
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              {itensRecebidos.length} {itensRecebidos.length === 1 ? "insumo" : "insumos"}
            </span>
          </div>

          {itensRecebidos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Nenhum item adicionado à lista de entrada ainda.</p>
              <p className="text-xs">Selecione um insumo acima, preencha a quantidade e clique em &quot;Incluir na Entrada&quot;.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {itensRecebidos.map((item) => (
                <div
                  key={item.idTemp}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {item.fotoPreview ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-300 shrink-0">
                        <Image
                          src={item.fotoPreview}
                          alt={item.nome}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <PackagePlus className="w-5 h-5" />
                      </div>
                    )}

                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {item.nome}
                      </p>
                      <p className="text-xs font-semibold text-emerald-700">
                        Fornecedor: {item.fornecedor}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        {item.dataValidade && (
                          <span>Validade: {new Date(item.dataValidade + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                        )}
                        {item.lote && <span>• Lote: {item.lote}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-base sm:text-lg font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      +{item.quantidade} {item.unidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerItem(item.idTemp)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remover da lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {itensRecebidos.length > 0 && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-base font-extrabold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gravando no Estoque...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Confirmar Entrada no Estoque</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}