"use client";

import { useState, useRef } from "react";
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
  Camera,
  Building2,
} from "lucide-react";

interface InsumoDisponivel {
  id: string;
  nome: string;
  unidadePadrao: string;
  categoria: string;
}

interface ItemRecebido {
  idTemp: string;
  insumoId: string;
  nome: string;
  fornecedor: string;
  quantidade: number;
  unidade: string;
  dataValidade?: string;
  lote?: string;
  fotoUrl?: string;
}

const CATEGORIAS = [
  "Todos",
  "Grãos & Cereais",
  "Proteínas & Frios",
  "Hortifrúti",
  "Laticínios",
  "Especificações & Condimentos",
] as const;

const INSUMOS_CATALOGADOS: InsumoDisponivel[] = [
  { id: "g1", nome: "Arroz Parboilizado", unidadePadrao: "Kg", categoria: "Grãos & Cereais" },
  { id: "g2", nome: "Feijão Carioca", unidadePadrao: "Kg", categoria: "Grãos & Cereais" },
  { id: "g3", nome: "Feijão Macassar", unidadePadrao: "Kg", categoria: "Grãos & Cereais" },
  { id: "g4", nome: "Macarrão Espaguete", unidadePadrao: "Kg", categoria: "Grãos & Cereais" },
  { id: "g5", nome: "Macarrão (Sopa)", unidadePadrao: "Kg", categoria: "Grãos & Cereais" },
  { id: "g6", nome: "Flocão de Milho (Cuscuz)", unidadePadrao: "Kg", categoria: "Grãos & Cereais" },
  { id: "g7", nome: "Farinha de Mandioca (Farofa)", unidadePadrao: "Kg", categoria: "Grãos & Cereais" },

  { id: "p1", nome: "Peito de Frango", unidadePadrao: "Kg", categoria: "Proteínas & Frios" },
  { id: "p2", nome: "Coxa de Frango", unidadePadrao: "Kg", categoria: "Proteínas & Frios" },
  { id: "p3", nome: "Carne Bovina (Moída)", unidadePadrao: "Kg", categoria: "Proteínas & Frios" },
  { id: "p4", nome: "Carne Bovina (Acém)", unidadePadrao: "Kg", categoria: "Proteínas & Frios" },
  { id: "p5", nome: "Charque", unidadePadrao: "Kg", categoria: "Proteínas & Frios" },
  { id: "p6", nome: "Linguiça Calabresa", unidadePadrao: "Kg", categoria: "Proteínas & Frios" },
  { id: "p7", nome: "Bacon", unidadePadrao: "Kg", categoria: "Proteínas & Frios" },
  { id: "p8", nome: "Ovos Pasteurizados / Cartela", unidadePadrao: "Und", categoria: "Proteínas & Frios" },

  { id: "h1", nome: "Abóbora", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h2", nome: "Alho in natura", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h4", nome: "Banana", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h5", nome: "Batata Inglesa", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h6", nome: "Beterraba", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h7", nome: "Cebola", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h9", nome: "Cenoura", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h10", nome: "Coentro", unidadePadrao: "Maço", categoria: "Hortifrúti" },
  { id: "h11", nome: "Pimentão", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h12", nome: "Tomate", unidadePadrao: "Kg", categoria: "Hortifrúti" },
  { id: "h13", nome: "Couve", unidadePadrao: "Maço", categoria: "Hortifrúti" },

  { id: "l1", nome: "Leite in natura", unidadePadrao: "Lt", categoria: "Laticínios" },
  { id: "l2", nome: "Creme de Leite", unidadePadrao: "Und", categoria: "Laticínios" },
  { id: "l3", nome: "Margarina", unidadePadrao: "Kg", categoria: "Laticínios" },
  { id: "l4", nome: "Queijo Mussarela", unidadePadrao: "Kg", categoria: "Laticínios" },
  { id: "l5", nome: "Queijo Ralado", unidadePadrao: "Pct", categoria: "Laticínios" },

  { id: "e2", nome: "Açúcar Cristal", unidadePadrao: "Kg", categoria: "Especificações & Condimentos" },
  { id: "e5", nome: "Azeite de Oliva", unidadePadrao: "Lt", categoria: "Especificações & Condimentos" },
  { id: "e6", nome: "Biscoito Cream Cracker", unidadePadrao: "Pct", categoria: "Especificações & Condimentos" },
  { id: "e7", nome: "Biscoito Maria", unidadePadrao: "Pct", categoria: "Especificações & Condimentos" },
  { id: "e8", nome: "Café", unidadePadrao: "Kg", categoria: "Especificações & Condimentos" },
  { id: "e14", nome: "Extrato de Tomate", unidadePadrao: "Kg", categoria: "Especificações & Condimentos" },
  { id: "e20", nome: "Óleo Vegetal", unidadePadrao: "Lt", categoria: "Especificações & Condimentos" },
  { id: "e23", nome: "Sal", unidadePadrao: "Kg", categoria: "Especificações & Condimentos" },
  { id: "e25", nome: "Azeitona em Conserva", unidadePadrao: "Kg", categoria: "Especificações & Condimentos" },
];

export default function RecebimentoPage() {
  const [dataEntrega, setDataEntrega] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [itensRecebidos, setItensRecebidos] = useState<ItemRecebido[]>([]);
  const [feedbackSucesso, setFeedbackSucesso] = useState(false);

  // Filtros de seleção
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todos");
  const [busca, setBusca] = useState("");
  const [buscaFocada, setBuscaFocada] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<InsumoDisponivel | null>(null);

  // Campos do formulário do produto
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [dataValidade, setDataValidade] = useState("");
  const [lote, setLote] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const insumosFiltrados = INSUMOS_CATALOGADOS.filter((item) => {
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
      const url = URL.createObjectURL(file);
      setFotoPreview(url);
    }
  };

  const removerFoto = () => {
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selecionarInsumo = (insumo: InsumoDisponivel) => {
    setInsumoSelecionado(insumo);
    setBusca(insumo.nome);
    setBuscaFocada(false);
  };

  const adicionarItem = () => {
    if (!insumoSelecionado) return;
    const qtdNum = parseFloat(quantidade);
    if (isNaN(qtdNum) || qtdNum <= 0) return;
    if (!fornecedor.trim()) return;

    const novoItem: ItemRecebido = {
      idTemp: Math.random().toString(),
      insumoId: insumoSelecionado.id,
      nome: insumoSelecionado.nome,
      fornecedor: fornecedor.trim(),
      quantidade: qtdNum,
      unidade: insumoSelecionado.unidadePadrao,
      dataValidade: dataValidade || undefined,
      lote: lote.trim() || undefined,
      fotoUrl: fotoPreview || undefined,
    };

    setItensRecebidos((prev) => [novoItem, ...prev]);
    setInsumoSelecionado(null);
    setQuantidade("");
    setDataValidade("");
    setLote("");
    setBusca("");
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removerItem = (idTemp: string) => {
    setItensRecebidos((prev) => prev.filter((item) => item.idTemp !== idTemp));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itensRecebidos.length === 0) return;

    setFeedbackSucesso(true);
    setTimeout(() => {
      setFeedbackSucesso(false);
      setItensRecebidos([]);
      setFornecedor("");
    }, 3000);
  };

  const podeIncluir =
    insumoSelecionado &&
    fornecedor.trim().length > 0 &&
    Boolean(quantidade) &&
    parseFloat(quantidade) > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Entrada de Mercadorias
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Recebimento de Insumos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lance e confira os itens recebidos dos fornecedores para entrada no estoque.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 border border-slate-300 rounded-xl shadow-xs self-start sm:self-auto">
          <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="date"
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
            className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {feedbackSucesso && (
        <div className="p-4 sm:p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">Entrada registrada com sucesso!</p>
            <p className="text-xs text-emerald-100">
              O estoque foi incrementado e o registro de recebimento foi salvo.
            </p>
          </div>
        </div>
      )}

      {/* 2. CARD COMPLETO DE LANÇAMENTO */}
      <div className="bg-emerald-50/50 border-2 border-emerald-200/80 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-600" />
            <span>Selecionar Insumo e Detalhes</span>
          </h2>

          {insumoSelecionado && (
            <span className="text-xs font-bold text-emerald-700 bg-white border border-emerald-300 px-3 py-1 rounded-full">
              Selecionado: {insumoSelecionado.nome}
            </span>
          )}
        </div>

        {/* Abas das Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoriaAtiva === cat
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
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
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
          />

          {buscaFocada && busca.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border-2 border-emerald-400 rounded-xl shadow-xl z-30 divide-y divide-slate-100">
              {insumosFiltrados.length === 0 ? (
                <div className="p-3 text-xs text-slate-400 text-center font-medium">
                  Nenhum produto encontrado com "{busca}"
                </div>
              ) : (
                insumosFiltrados.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => selecionarInsumo(item)}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.nome}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      {item.categoria} • {item.unidadePadrao}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Chips dos Produtos */}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
          {insumosFiltrados.map((insumo) => (
            <button
              key={insumo.id}
              type="button"
              onClick={() => selecionarInsumo(insumo)}
              className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                insumoSelecionado?.id === insumo.id
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-xs scale-105"
                  : "bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50"
              }`}
            >
              {insumo.nome}
            </button>
          ))}
        </div>

        {/* Dados do Insumo Selecionado com Fornecedor Integrado */}
        {insumoSelecionado && (
          <div className="pt-4 border-t-2 border-emerald-200/70 space-y-4 animate-in fade-in duration-200">
            {/* Linha 1: Fornecedor Obrigatório */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Fornecedor / Origem da Entrega *</span>
              </label>
              <input
                type="text"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex.: Agropecuária Vale do Ipojuca, Cooperativa Local, Distribuidora Bela..."
                className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl font-semibold text-sm sm:text-base text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Linha 2: Quantidade, Validade e Lote */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4 space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Quantidade ({insumoSelecionado.unidadePadrao}) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Ex.: 25"
                  className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl font-black text-lg text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Validade <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={dataValidade}
                  onChange={(e) => setDataValidade(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Lote <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  placeholder="Ex.: LT-2024"
                  className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Linha 3: Foto e Botão de Inclusão */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleFotoChange}
                  className="hidden"
                  id="foto-upload"
                />

                {!fotoPreview ? (
                  <label
                    htmlFor="foto-upload"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Tirar Foto / Anexar Imagem</span>
                  </label>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300">
                      <Image
                        src={fotoPreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Foto anexada</p>
                      <button
                        type="button"
                        onClick={removerFoto}
                        className="text-[11px] text-red-600 hover:underline font-semibold"
                      >
                        Remover foto
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={adicionarItem}
                disabled={!podeIncluir}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl font-extrabold text-sm shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Incluir na Entrada</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. LISTA DE CONFERÊNCIA COM FORNECEDOR */}
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
              <p className="text-xs">Selecione um insumo acima, preencha os dados e clique em "Incluir".</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {itensRecebidos.map((item) => (
                <div
                  key={item.idTemp}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {item.fotoUrl ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-300 shrink-0">
                        <Image
                          src={item.fotoUrl}
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
                          <span>Validade: {new Date(item.dataValidade).toLocaleDateString("pt-BR")}</span>
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
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-base font-extrabold shadow-md transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>Confirmar Entrada no Estoque</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}