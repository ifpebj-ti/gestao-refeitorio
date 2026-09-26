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
} from "lucide-react";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import { registrarEntradaApi } from "@/lib/movimentacoes";

export default function RecebimentoCozinhaPage() {
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoResponse[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);

  // Formulário de entrada
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoResponse | null>(null);
  const [origemEntrada, setOrigemEntrada] = useState<"EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA" | "">("");
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [dataValidade, setDataValidade] = useState("");
  const [lote, setLote] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);

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
    setOrigemEntrada("");
    setFornecedor("");
    setQuantidade("");
    setDataValidade("");
    setLote("");
    removerFoto();
  };

  const handleSalvarEntrada = async () => {
    if (!produtoSelecionado) return;
    const qtdNum = parseFloat(quantidade);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      alert("Informe uma quantidade válida!");
      return;
    }
    if (!origemEntrada) {
      alert("Selecione o canal / origem da mercadoria!");
      return;
    }
    if (!fornecedor.trim()) {
      alert("Informe o fornecedor!");
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

    try {
      setSalvando(true);
      setErroEnvio(null);

      const res = await registrarEntradaApi(
        {
          produtoId: produtoSelecionado.id,
          localId,
          quantidade: qtdNum,
          data: hojeIso,
          origem: (origemEntrada || "EXTERNA") as "EXTERNA" | "AGROINDUSTRIA" | "AGROPECUARIA" | "INTERNA",
          valor: valorTotal,
          dataValidade: dataValidade || undefined,
          fornecedor: fornecedor.trim() || undefined,
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
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
              <span>Insumo a Receber *</span>
              {produtoSelecionado && (
                <span className="text-[11px] font-semibold text-emerald-700 lowercase">
                  Saldo em estoque: {produtoSelecionado.saldoTotal ?? 0} {produtoSelecionado.unidadeMedida}
                </span>
              )}
            </label>
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

          {/* 2. Origem e Fornecedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Canal / Origem da Mercadoria *
              </label>
              <select
                value={origemEntrada}
                onChange={(e) => {
                  const novaOrigem = e.target.value as any;
                  setOrigemEntrada(novaOrigem);
                  if (novaOrigem === "AGROPECUARIA") {
                    setFornecedor("Agropecuária (Fazenda IFPE)");
                  } else if (novaOrigem === "AGROINDUSTRIA") {
                    setFornecedor("Agroindústria (IFPE)");
                  } else if (novaOrigem === "EXTERNA" && (!fornecedor || fornecedor.includes("IFPE"))) {
                    setFornecedor("");
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">Selecione o canal / origem...</option>
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
                list="sugestoes-fornecedor-cozinha"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex.: Agropecuária IFPE, Cooperativa, Distribuidora..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600"
              />
              <datalist id="sugestoes-fornecedor-cozinha">
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
                Quantidade Recebida {produtoSelecionado ? `(${produtoSelecionado.unidadeMedida})` : ""} *
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
              disabled={salvando || !produtoSelecionado || !origemEntrada || !quantidade || parseFloat(quantidade) <= 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{salvando ? "Registrando no estoque..." : "Salvar Entrada no Estoque"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}