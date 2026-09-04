"use client";

import { useState } from "react";
import CardapioCard from "@/app/components/CardapioCard";
import SeletorRefeicao, { TipoRefeicao } from "@/app/components/SeletorRefeicao";
import {
  Calendar,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  Sparkles,
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
  { id: "g3", nome: "Feijão Macáçar", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g4", nome: "Macarrão Espaguete", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g5", nome: "Macarrão (Sopa)", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },
  { id: "g6", nome: "Flocão de Milho (Cuscuz)", unidade: "Kg", categoria: "Grãos & Cereais", quantidadeUsada: 0 },

  // --- PROTEÍNAS & FRIOS ---
  { id: "p1", nome: "Peito de Frango", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p2", nome: "Carne Bovina (Patinho/Moída)", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p3", nome: "Carne Bovina (Acém/Cozido)", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p4", nome: "Charque", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p5", nome: "Linguiça Calabresa", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p6", nome: "Bacon", unidade: "Kg", categoria: "Proteínas & Frios", quantidadeUsada: 0 },
  { id: "p7", nome: "Ovos Pasteurizados / Cartela", unidade: "Und", categoria: "Proteínas & Frios", quantidadeUsada: 0 },

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
];

const CARDAPIO_MOCK: Record<TipoRefeicao, { pratoPrincipal: string; acompanhamentos: string[]; sobremesa?: string }> = {
  "Café da Manhã": {
    pratoPrincipal: "Cuscuz Nordestino com Ovos Mexidos e Queijo Coalho",
    acompanhamentos: ["Café com leite", "Banana prata", "Biscoito Cream Cracker"],
  },
  "Almoço": {
    pratoPrincipal: "Frango Cozido ao Molho de Tomate Natural com Cenoura e Batata",
    acompanhamentos: ["Arroz Parboilizado", "Feijão Carioca temperado com louro", "Salada crua (Tomate, Pepino e Alface)"],
    sobremesa: "Melancia fatiada",
  },
  "Jantar": {
    pratoPrincipal: "Sopa Nutritiva de Carne Desfiada com Macarrão e Legumes",
    acompanhamentos: ["Torradas com orégano", "Café com leite"],
  },
};

export default function ConsumoDiarioPage() {
  const [dataRegistro, setDataRegistro] = useState(
    new Date().toISOString().split("T")[0]
  );
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* 1. TOPO: TÍTULO, DATA E NOVO SELETOR DE REFEIÇÃO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Folha de Consumo e Baixa Diária
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Registro de Insumos da Cozinha
          </h1>
          <p className="text-base text-slate-500 mt-1">
            Lance as quantidades utilizadas no preparo para baixa direta e balanço diário.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-4 py-3 border border-slate-300 rounded-xl shadow-sm">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <input
              type="date"
              value={dataRegistro}
              onChange={(e) => setDataRegistro(e.target.value)}
              className="text-base font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <SeletorRefeicao valor={tipoRefeicao} onChange={setTipoRefeicao} />
        </div>
      </div>

      <CardapioCard refeicao={tipoRefeicao} dados={cardapioAtual} />

      {/* Alerta de Sucesso */}
      {feedbackSucesso && (
        <div className="p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-4 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-7 h-7 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-base">Consumo salvo e registrado com sucesso!</p>
            <p className="text-xs text-emerald-100">
              As baixas de estoque deste {tipoRefeicao} foram calculadas e os dados foram salvos.
            </p>
          </div>
        </div>
      )}

      {/* 3. FORMULÁRIO COM TODAS AS SEÇÕES DA PLANILHA */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {categorias.map((catNome) => {
            const itensDaCategoria = itens.filter((i) => i.categoria === catNome);

            return (
              <div
                key={catNome}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-wide uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    {catNome}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {itensDaCategoria.length} produtos catalogados
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/40">
                    <span className="col-span-6">Produto / Insumo</span>
                    <span className="col-span-2 text-center">Unidade de Medida</span>
                    <span className="col-span-4 text-right pr-6">Quantidade Utilizada</span>
                  </div>

                  {itensDaCategoria.map((item) => {
                    const emUso = item.quantidadeUsada > 0;

                    return (
                      <div
                        key={item.id}
                        className={`grid grid-cols-1 sm:grid-cols-12 px-6 py-4 items-center gap-4 transition-colors ${
                          emUso ? "bg-emerald-50/40" : "hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="sm:col-span-6 flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full shrink-0 ${
                              emUso ? "bg-emerald-600 scale-110" : "bg-slate-200"
                            } transition-transform`}
                          />
                          <span
                            className={`text-base ${
                              emUso
                                ? "font-bold text-slate-900"
                                : "font-medium text-slate-700"
                            }`}
                          >
                            {item.nome}
                          </span>
                        </div>

                        <div className="sm:col-span-2 text-left sm:text-center">
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-md">
                            {item.unidade}
                          </span>
                        </div>

                        <div className="sm:col-span-4 flex items-center justify-end gap-3">
                          <div className="flex items-center border-2 border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden focus-within:border-emerald-600">
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, -0.5)}
                              disabled={item.quantidadeUsada <= 0}
                              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
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
                              className="w-24 text-center font-black text-slate-900 text-lg py-2 bg-transparent focus:outline-none"
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

        {/* 4. CAMPO DE OBSERVAÇÕES E OCORRÊNCIAS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <label className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Observações da Refeição (Sobras, Reposições ou Ocorrências)</span>
          </label>
          <textarea
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: Almoço servido para 180 alunos. Sobra limpa de 4kg de arroz guardada para o jantar. Ajustada quantidade de sal..."
            className="w-full border-2 border-slate-200 rounded-xl p-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        {/* 5. BARRA INFERIOR DE CONCLUSÃO */}
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border-2 border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              {totalLancados}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {totalLancados === 1 ? "1 insumo selecionado" : `${totalLancados} insumos selecionados`}
              </p>
              <p className="text-xs text-slate-500">
                Pronto para registrar o consumo do {tipoRefeicao}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })))
              }
              className="w-1/2 sm:w-auto px-5 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Limpar Tudo
            </button>

            <button
              type="submit"
              disabled={totalLancados === 0}
              className="w-1/2 sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-base font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span>Registrar Consumo</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}