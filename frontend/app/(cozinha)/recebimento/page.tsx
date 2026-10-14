"use client";

import { useState, useRef, useEffect } from "react";
import {
  PackagePlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  ImageIcon,
  Building2,
  Camera,
  Scale,
  X,
} from "lucide-react";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import { registrarEntradaApi } from "@/lib/movimentacoes";
import { UNIDADES_MEDIDA_SUGERIDAS, normalizarUnidadeMedida } from "@/lib/unidades";

export default function RecebimentoCozinhaPage() {
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoResponse[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);

  // Formulário de entrada
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoResponse | null>(null);
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [dataValidade, setDataValidade] = useState("");
  const [lote, setLote] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);

  // Estados para Alterar Unidade de Medida
  const [modalEdicaoUnidadeAberto, setModalEdicaoUnidadeAberto] = useState(false);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("Kg");
  const [unidadeCustomizada, setUnidadeCustomizada] = useState("");
  const [usarOutraUnidade, setUsarOutraUnidade] = useState(false);
  const [salvandoUnidade, setSalvandoUnidade] = useState(false);
  const [erroUnidade, setErroUnidade] = useState<string | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [sucessoFeedback, setSucessoFeedback] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const carregarCatalogo = async () => {
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
  };

  useEffect(() => {
    carregarCatalogo();
  }, []);

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

  const limparSelecao = () => {
    setProdutoSelecionado(null);
    setFornecedor("");
    setQuantidade("");
    setDataValidade("");
    setLote("");
    removerFoto();
  };

  const abrirModalAlterarUnidade = () => {
    if (!produtoSelecionado) return;
    const uAtual = (produtoSelecionado.unidadeMedida || "").trim();
    const ehSugerida = UNIDADES_MEDIDA_SUGERIDAS.some(
      (u) => u.sigla.toLowerCase() === uAtual.toLowerCase()
    );
    const unidadeNorm = normalizarUnidadeMedida(uAtual);
    if (ehSugerida) {
      setUnidadeSelecionada(unidadeNorm);
      setUsarOutraUnidade(false);
      setUnidadeCustomizada("");
    } else {
      setUnidadeSelecionada("OUTRA");
      setUsarOutraUnidade(true);
      setUnidadeCustomizada(uAtual);
    }
    setErroUnidade(null);
    setModalEdicaoUnidadeAberto(true);
  };

  const handleSalvarUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoSelecionado) return;
    const unidadeFinal = usarOutraUnidade
      ? (unidadeCustomizada.trim() || "Und")
      : unidadeSelecionada;

    if (!unidadeFinal) {
      setErroUnidade("Informe a nova unidade de medida.");
      return;
    }

    setSalvandoUnidade(true);
    setErroUnidade(null);
    try {
      const atualizado = await produtoService.atualizarUnidadeMedida(produtoSelecionado.id, unidadeFinal);
      setProdutoSelecionado(atualizado);
      setProdutosDisponiveis((prev) =>
        prev.map((p) => (p.id === atualizado.id ? atualizado : p))
      );
      setModalEdicaoUnidadeAberto(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar unidade de medida.";
      setErroUnidade(msg);
    } finally {
      setSalvandoUnidade(false);
    }
  };

  const handleSalvarEntrada = async () => {
    if (!produtoSelecionado) return;
    const qtdNum = parseFloat(quantidade);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      alert("Informe uma quantidade válida!");
      return;
    }
    if (!fornecedor.trim()) {
      alert("Informe o fornecedor ou setor de origem!");
      return;
    }

    const LOCAL_CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";
    const LOCAL_DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";

    const ehRefrigerado =
      produtoSelecionado.categoria === "Proteínas & Frios" ||
      produtoSelecionado.categoria === "Laticínios" ||
      produtoSelecionado.categoria.toLowerCase().includes("frio") ||
      produtoSelecionado.categoria.toLowerCase().includes("laticínio") ||
      produtoSelecionado.categoria.toLowerCase().includes("laticinio");
    const localId = ehRefrigerado ? LOCAL_CONGELADOS : LOCAL_DESPENSA;

    const valorUnitario =
      produtoSelecionado.valorReferencia && produtoSelecionado.valorReferencia > 0
        ? produtoSelecionado.valorReferencia
        : 10.0;
    const valorTotal = Number((qtdNum * valorUnitario).toFixed(2));
    const hojeIso = new Date().toISOString().split("T")[0];

    const fTrim = fornecedor.trim();
    let origemFinal: "EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA" = "EXTERNA";
    const fLower = fTrim.toLowerCase();
    if (fLower.includes("agroind")) {
      origemFinal = "AGROINDUSTRIA";
    } else if (fLower.includes("agropec") || fLower.includes("fazenda")) {
      origemFinal = "AGROPECUARIA";
    } else if (fLower.includes("interna") || fLower.includes("horta")) {
      origemFinal = "INTERNA";
    }

    try {
      setSalvando(true);
      setErroEnvio(null);

      const res = await registrarEntradaApi(
        {
          produtoId: produtoSelecionado.id,
          localId,
          quantidade: qtdNum,
          data: hojeIso,
          origem: origemFinal,
          valor: valorTotal,
          dataValidade: dataValidade || undefined,
          fornecedor: fTrim || undefined,
        },
        arquivoFoto
      );

      if (res?.id && fornecedor.trim()) {
        try {
          localStorage.setItem(`@gestao_refeitorio:mov_fornecedor_${res.id}`, fornecedor.trim());
        } catch (e) {
          // ignore
        }
      }

      await carregarCatalogo();
      setSucessoFeedback(true);
      limparSelecao();

      setTimeout(() => {
        setSucessoFeedback(false);
      }, 3500);
    } catch (err: any) {
      console.error("Erro ao registrar entrada:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Não foi possível registrar a entrada do insumo.";
      setErroEnvio(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-28">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Entradas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registro e conferência de insumos recebidos para reposição do estoque
          </p>
        </div>
      </div>

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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Insumo a Receber *
              </label>
              {produtoSelecionado && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 lowercase">
                    Saldo: {produtoSelecionado.saldoTotal ?? 0} {produtoSelecionado.unidadeMedida}
                  </span>
                  <button
                    type="button"
                    onClick={abrirModalAlterarUnidade}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Alterar unidade deste insumo"
                  >
                    <Scale className="w-3 h-3 text-emerald-600" />
                    <span>Unidade ({produtoSelecionado.unidadeMedida})</span>
                  </button>
                </div>
              )}
            </div>
            {carregandoProdutos ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Carregando catálogo de insumos...</span>
              </div>
            ) : (
              <select
                value={produtoSelecionado?.id || ""}
                onChange={(e) => {
                  const item = produtosDisponiveis.find((i) => i.id === e.target.value);
                  setProdutoSelecionado(item || null);
                }}
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value="">Selecione o insumo recebido...</option>
                {produtosDisponiveis
                  .slice()
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} — {i.categoria} [{i.unidadeMedida}]
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* 2. Fornecedor / Setor de Origem */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Fornecedor / Setor de Origem *</span>
            </label>
            <input
              type="text"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Digite quem forneceu ou o setor (ex: Fazenda IFPE, Distribuidora, Cooperativa...)"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* 3. Quantidade e Validade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Quantidade Recebida {produtoSelecionado ? `(${produtoSelecionado.unidadeMedida})` : ""} *
                </label>
                {produtoSelecionado && (
                  <button
                    type="button"
                    onClick={abrirModalAlterarUnidade}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                    title="Modificar unidade de medida deste produto"
                  >
                    <Scale className="w-3 h-3" />
                    <span>Mudar unidade</span>
                  </button>
                )}
              </div>
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

            <div className="space-y-1.5">
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
          </div>

          {/* 4. Lote e Foto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Número do Lote (opcional)
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
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
                {fotoPreview ? (
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
                      onChange={handleFotoChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {erroEnvio && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {erroEnvio}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={limparSelecao}
              disabled={salvando}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={handleSalvarEntrada}
              disabled={salvando || !produtoSelecionado || !quantidade || parseFloat(quantidade) <= 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{salvando ? "Registrando no estoque..." : "Salvar Entrada no Estoque"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Unidade de Medida */}
      {modalEdicaoUnidadeAberto && produtoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Alterar Unidade de Medida
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                    {produtoSelecionado.nome}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEdicaoUnidadeAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarUnidade} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <p>
                  Unidade atual:{" "}
                  <strong className="text-slate-900 font-bold px-1.5 py-0.5 bg-slate-200/70 rounded">
                    {produtoSelecionado.unidadeMedida}
                  </strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  A alteração será aplicada a este produto no estoque e nas próximas entradas.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Escolha a Nova Unidade *
                </label>
                <select
                  value={usarOutraUnidade ? "OUTRA" : unidadeSelecionada}
                  onChange={(e) => {
                    if (e.target.value === "OUTRA") {
                      setUsarOutraUnidade(true);
                    } else {
                      setUsarOutraUnidade(false);
                      setUnidadeSelecionada(e.target.value);
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {UNIDADES_MEDIDA_SUGERIDAS.map((u) => (
                    <option key={u.sigla} value={u.sigla}>
                      {u.nome}
                    </option>
                  ))}
                  <option value="OUTRA">✏️ Outra unidade personalizada...</option>
                </select>

                {usarOutraUnidade && (
                  <div className="pt-1.5 space-y-1">
                    <label className="text-[11px] font-bold text-emerald-900 uppercase">
                      Digite o nome ou sigla da unidade:
                    </label>
                    <input
                      type="text"
                      required
                      value={unidadeCustomizada}
                      onChange={(e) => setUnidadeCustomizada(e.target.value)}
                      placeholder="Ex: Garrafa, Barra, Pote, Balde, Bisnaga..."
                      className="w-full p-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                )}
              </div>

              {erroUnidade && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroUnidade}</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEdicaoUnidadeAberto(false)}
                  disabled={salvandoUnidade}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoUnidade}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvandoUnidade && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{salvandoUnidade ? "Atualizando..." : "Confirmar Unidade"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}