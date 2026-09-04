"use client";


import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import SeletorRefeicao, { TipoRefeicao } from "@/app/components/SeletorRefeicao";
import CardapioCard from "@/app/components/CardapioCard";
import {
  Calendar,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  Info,
} from "lucide-react";

interface ItemFicha {
  id: string;
  nome: string;
  unidade: string;
  categoria: "Grãos & Cereais" | "Proteínas & Frios" | "Hortifrúti" | "Laticínios" | "Especificações & Condimentos";
  quantidadeUsada: number;
}

const BASE_ITENS: ItemFicha[] = [
  // --- GRÃOS & CEREAIS ---
  { id: "g1", nome: "Arroz Parboilizado", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g2", nome: "Feijão Carioca", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g3", nome: "Feijão Macassar", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g4", nome: "Macarrão Espaguete", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g5", nome: "Macarrão (Sopa)", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g6", nome: "Flocão de Milho (Cuscuz)", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g7", nome: "Farinha de Mandioca (Farofa)", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },

  // --- PROTEÍNAS & FRIOS ---
  { id: "p1", nome: "Peito de Frango", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p2", nome: "Coxa de Frango", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p3", nome: "Carne Bovina (Patinho/Moída)", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p4", nome: "Carne Bovina (Acém/Cozido)", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p5", nome: "Charque", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p6", nome: "Linguiça Calabresa", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p7", nome: "Bacon", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p8", nome: "Ovos Pasteurizados / Cartela", unidade: "Und", categoria: "Proteínas & Frios", quantidadeUsada: 0 },

  // --- HORTIFRÚTI ---
  { id: "h1", nome: "Abóbora", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h2", nome: "Alho in natura", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h3", nome: "Alho triturado", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h4", nome: "Banana", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h5", nome: "Batata Inglesa", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h6", nome: "Beterraba", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h7", nome: "Cebola", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h8", nome: "Cebolinha", unidade: "Maço", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h9", nome: "Cenoura", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h10", nome: "Coentro", unidade: "Maço", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h11", nome: "Pimentão", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h12", nome: "Tomate", unidade: "Kg", categoria: "Hortifrúti", quantidadeUsada: 0 },
  { id: "h13", nome: "Couve", unidade: "Maço", categoria: "Hortifrúti", quantidadeUsada: 0 },

  // --- LATICÍNIOS ---
  { id: "l1", nome: "Leite in natura", unidade: "Lt", categoria: "Laticínios", quantidadeUsada: 0 },
  { id: "l2", nome: "Creme de Leite", unidade: "Und", categoria: "Laticínios", quantidadeUsada: 0 },
  { id: "l3", nome: "Margarina", unidade: "Kg", categoria: "Laticínios", quantidadeUsada: 0 },
  { id: "l4", nome: "Queijo Mussarela", unidade: "Kg", categoria: "Laticínios", quantidadeUsada: 0 },
  { id: "l5", nome: "Queijo Ralado", unidade: "Pct", categoria: "Laticínios", quantidadeUsada: 0 },

  // --- ESPECIFICAÇÕES & CONDIMENTOS ---
  { id: "e1", nome: "Açafrão", unidade: "g", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e2", nome: "Açúcar Cristal", unidade: "Kg", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e3", nome: "Água Mineral", unidade: "Lt", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e4", nome: "Amido de Milho", unidade: "Kg", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e5", nome: "Azeite de Oliva", unidade: "Lt", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e6", nome: "Biscoito Cream Cracker", unidade: "Pct", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e7", nome: "Biscoito Maria", unidade: "Pct", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e8", nome: "Café", unidade: "Kg", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e9", nome: "Caldo de Carne", unidade: "Und", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e10", nome: "Caldo de Galinha", unidade: "Und", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e11", nome: "Coloral", unidade: "g", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e12", nome: "Cominho", unidade: "g", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e13", nome: "Ervilha", unidade: "Lata", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e14", nome: "Extrato de Tomate", unidade: "Kg", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e15", nome: "Folha de Louro", unidade: "g", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e16", nome: "Leite de Coco", unidade: "Vidro", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e17", nome: "Milho Verde", unidade: "Lata", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e18", nome: "Molho Shoyu", unidade: "Lt", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e19", nome: "Molho Inglês", unidade: "Vidro", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e20", nome: "Óleo Vegetal", unidade: "Lt", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e21", nome: "Orégano", unidade: "g", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e22", nome: "Pimenta do Reino", unidade: "g", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e23", nome: "Sal", unidade: "Kg", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e24", nome: "Vinagre", unidade: "Lt", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
  { id: "e25", nome: "Azeitona em Conserva", unidade: "Balde/Kg", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
];

const CARDAPIO_MOCK: Record<TipoRefeicao, string> = {
  "Café da Manhã":
    "Cuscuz nordestino com ovos mexidos ou queijo, banana prata, biscoito cream cracker, café e leite quente.",
  "Almoço":
    "Coxa de frango cozida, arroz, feijão macassar, macarrão, ovo cozido, farofa e cuscuz. Salada: tomate, beterraba crua, couve refogada e azeitona.",
  "Jantar":
    "Sopa nutritiva de carne desfiada com macarrão e legumes, torradas temperadas, café e leite.",
};

export default function ConsumoDiarioPage() {
  const [dataRegistro, setDataRegistro] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { bannerAlertasVisivel, dispensarBannerAlertas } = useAuth();
  const [tipoRefeicao, setTipoRefeicao] = useState<TipoRefeicao>("Almoço");
  const [itens, setItens] = useState<ItemFicha[]>(BASE_ITENS);
  const [observacao, setObservacao] = useState("");
  const [feedbackSucesso, setFeedbackSucesso] = useState(false);

  const cardapioAtual = CARDAPIO_MOCK[tipoRefeicao];

  const alterarQuantidade = (id: string, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const novo = Math.max(0, Number((item.quantidadeUsada + delta).toFixed(2)));
        return { ...item, quantidadeUsada: novo };
      })
    );
  };

  const definirQuantidadeDireta = (id: string, valor: string) => {
    const parsed = parseFloat(valor);
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          quantidadeUsada: isNaN(parsed) || parsed < 0 ? 0 : parsed,
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSucesso(true);
    setTimeout(() => {
      setFeedbackSucesso(false);
      setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })));
      setObservacao("");
    }, 3000);
  };

  const totalLancados = itens.filter((i) => i.quantidadeUsada > 0).length;

  const categorias = [
    "Grãos & Cereais",
    "Proteínas & Frios",
    "Hortifrúti",
    "Laticínios",
    "Especificações & Condimentos",
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 pb-44">
      {/* 1. TOPO: TÍTULO, DATA E SELETOR */}
      {/* BANNER DE AVISO (Só some quando clicam para ver os alertas) */}
      {bannerAlertasVisivel && (
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Folha de Consumo e Baixa Diária
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Registro de Insumos da Cozinha
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lance as quantidades utilizadas no preparo para baixa direta e balanço diário.
          </p>
        </div>

        {/* Filtros em coluna no mobile e linha no tablet/desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-white px-4 py-3 border border-slate-300 rounded-xl shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 sm:hidden">Data:</span>
            </div>
            <input
              type="date"
              value={dataRegistro}
              onChange={(e) => setDataRegistro(e.target.value)}
              className="text-sm sm:text-base font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <SeletorRefeicao valor={tipoRefeicao} onChange={setTipoRefeicao} />
        </div>
      </div>

      {/* 2. CARD DO CARDÁPIO */}
<CardapioCard refeicao={tipoRefeicao} descricao={cardapioAtual} />

      {/* Alerta de Sucesso */}
      {feedbackSucesso && (
        <div className="p-4 sm:p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 sm:gap-4 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">Consumo salvo com sucesso!</p>
            <p className="text-xs text-emerald-100">
              As baixas deste {tipoRefeicao} foram registradas.
            </p>
          </div>
        </div>
      )}

      {/* 3. FORMULÁRIO COM SEÇÕES RESPONSIVAS */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="space-y-4 sm:space-y-6">
          {categorias.map((catNome) => {
            const itensDaCategoria = itens.filter((i) => i.categoria === catNome);

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
                    {itensDaCategoria.length} itens
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {itensDaCategoria.map((item) => {
                    const emUso = item.quantidadeUsada > 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                          emUso ? "bg-emerald-50/40" : "hover:bg-slate-50/60"
                        }`}
                      >
                        {/* Nome do Item e Unidade (Inline no mobile) */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                emUso ? "bg-emerald-600 scale-125" : "bg-slate-300"
                              } transition-transform`}
                            />
                            <span
                              className={`text-sm sm:text-base truncate ${
                                emUso
                                  ? "font-bold text-slate-900"
                                  : "font-medium text-slate-700"
                              }`}
                            >
                              {item.nome}
                            </span>
                          </div>

                          <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-xs rounded-md shrink-0">
                            {item.unidade}
                          </span>
                        </div>

                        {/* Controles de Quantidade adaptados para toque rápido */}
                        <div className="flex items-center justify-end">
                          <div className="flex items-center border-2 border-slate-300 rounded-xl bg-white shadow-2xs overflow-hidden focus-within:border-emerald-600 w-full sm:w-auto justify-between sm:justify-start">
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, -0.5)}
                              disabled={item.quantidadeUsada <= 0}
                              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.quantidadeUsada || ""}
                              placeholder="0"
                              onChange={(e) =>
                                definirQuantidadeDireta(item.id, e.target.value)
                              }
                              className="w-20 sm:w-24 text-center font-black text-slate-900 text-base sm:text-lg py-2 bg-transparent focus:outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, 0.5)}
                              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. CAMPO DE OBSERVAÇÕES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2.5">
          <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Observações da Refeição (Sobras ou Ocorrências)</span>
          </label>
          <textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: Sobra de 3kg de arroz; ajustada quantidade de sal..."
            className="w-full border-2 border-slate-200 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        {/* Espaçador de segurança para a barra fixa não cobrir o campo */}
        <div className="h-16 w-full" aria-hidden="true" />

        {/* 5. BARRA FIXA FLUTUANTE ADAPTÁVEL */}
        <div className="fixed bottom-3 left-3 right-3 lg:left-72 lg:right-8 bg-white/95 backdrop-blur-md border-2 border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xl z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm sm:text-base shrink-0">
                {totalLancados}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  {totalLancados === 1 ? "1 insumo" : `${totalLancados} insumos`}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Para o {tipoRefeicao}
                </p>
              </div>
            </div>

            {/* Botão limpar no mobile */}
            <button
              type="button"
              onClick={() =>
                setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })))
              }
              className="sm:hidden text-xs font-bold text-slate-400 hover:text-slate-700 underline"
            >
              Limpar
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })))
              }
              className="hidden sm:inline-block px-4 py-3 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Limpar
            </button>

            <button
              type="submit"
              disabled={totalLancados === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-sm sm:text-base font-extrabold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Registrar Consumo</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}