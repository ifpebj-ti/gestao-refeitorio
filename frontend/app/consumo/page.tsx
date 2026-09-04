"use client";

import { useState, useEffect } from "react";
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
  ShieldCheck,
  Edit3,
  Lock,
  Clock,
} from "lucide-react";

interface ItemFicha {
  id: string;
  nome: string;
  unidade: string;
  categoria:
    | "Grãos & Cereais"
    | "Proteínas & Frios"
    | "Hortifrúti"
    | "Laticínios"
    | "Especificações & Condimentos";
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
  { id: "e25", nome: "Azeitona em Conserva", unidade: "Kg", categoria: "Especificações & Condimentos", quantidadeUsada: 0 },
];

const CARDAPIO_MOCK: Record<TipoRefeicao, string> = {
  "Café da Manhã":
    "Cuscuz nordestino com ovos mexidos ou queijo, banana prata, biscoito cream cracker, café e leite quente.",
  "Almoço":
    "Coxa de frango cozida, arroz, feijão macassar, macarrão, ovo cozido, farofa e cuscuz. Salada: tomate, beterraba crua, couve refogada e azeitona.",
  "Jantar":
    "Sopa nutritiva de carne desfiada com macarrão e legumes, torradas temperadas, café e leite.",
};

// Horários e status dinâmicos por turno
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
  const [itens, setItens] = useState<ItemFicha[]>(BASE_ITENS);
  const [observacao, setObservacao] = useState("");
  const [feedbackSucesso, setFeedbackSucesso] = useState(false);

  // Estados de controle para o modo do nutricionista
  const [turnoEncerradoPelaCozinha, setTurnoEncerradoPelaCozinha] = useState(false);
  const [modoEdicaoNutri, setModoEdicaoNutri] = useState(false);

  // Altera os dados e horários de forma contextual ao mudar de refeição ou perfil
  useEffect(() => {
    const turnoInfo = HORARIOS_ENCERRAMENTO_MOCK[tipoRefeicao];

    if (isNutricionista && turnoInfo.status) {
      setTurnoEncerradoPelaCozinha(true);
      setModoEdicaoNutri(false);

      if (tipoRefeicao === "Almoço") {
        setObservacao(
          "Sobra estimada de aproximadamente 2,5 kg de arroz na bancada de distribuição. Sem intercorrências no cozimento."
        );
        setItens((prev) =>
          prev.map((item) => {
            if (item.id === "p2") return { ...item, quantidadeUsada: 45 };
            if (item.id === "g1") return { ...item, quantidadeUsada: 30 };
            if (item.id === "g3") return { ...item, quantidadeUsada: 18 };
            if (item.id === "g4") return { ...item, quantidadeUsada: 15 };
            if (item.id === "p8") return { ...item, quantidadeUsada: 120 };
            if (item.id === "h12") return { ...item, quantidadeUsada: 8 };
            if (item.id === "h6") return { ...item, quantidadeUsada: 6 };
            if (item.id === "h13") return { ...item, quantidadeUsada: 10 };
            if (item.id === "e23") return { ...item, quantidadeUsada: 2 };
            if (item.id === "e20") return { ...item, quantidadeUsada: 4 };
            return { ...item, quantidadeUsada: 0 };
          })
        );
      } else if (tipoRefeicao === "Café da Manhã") {
        setObservacao("Consumo regular. Ovos mexidos repostos 1x durante o pico da manhã.");
        setItens((prev) =>
          prev.map((item) => {
            if (item.id === "g6") return { ...item, quantidadeUsada: 20 };
            if (item.id === "p8") return { ...item, quantidadeUsada: 80 };
            if (item.id === "l1") return { ...item, quantidadeUsada: 25 };
            if (item.id === "e8") return { ...item, quantidadeUsada: 4 };
            if (item.id === "e2") return { ...item, quantidadeUsada: 6 };
            return { ...item, quantidadeUsada: 0 };
          })
        );
      }
    } else if (isNutricionista && !turnoInfo.status) {
      // Jantar ainda não finalizado pela cozinha
      setTurnoEncerradoPelaCozinha(false);
      setModoEdicaoNutri(false);
      setObservacao("");
      setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })));
    } else {
      // Perfil Cozinha
      setTurnoEncerradoPelaCozinha(false);
      setModoEdicaoNutri(true);
      setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })));
      setObservacao("");
    }
  }, [isNutricionista, tipoRefeicao]);

  const cardapioAtual = CARDAPIO_MOCK[tipoRefeicao];

  const alterarQuantidade = (id: string, delta: number) => {
    if (isNutricionista && !modoEdicaoNutri) return;
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const novo = Math.max(0, Number((item.quantidadeUsada + delta).toFixed(2)));
        return { ...item, quantidadeUsada: novo };
      })
    );
  };

  const definirQuantidadeDireta = (id: string, valor: string) => {
    if (isNutricionista && !modoEdicaoNutri) return;
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
      if (!isNutricionista) {
        setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })));
        setObservacao("");
      } else {
        setModoEdicaoNutri(false);
      }
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
      {/* 1. TOPO: TÍTULO, STATUS DINÂMICO E SELETOR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] sm:text-xs font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {isNutricionista ? "Auditoria e Conferência" : "Folha de Consumo e Baixa Diária"}
            </span>

            {/* Status dinâmico por refeição */}
            {isNutricionista && turnoEncerradoPelaCozinha && (
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Finalizado pela Cozinha às {HORARIOS_ENCERRAMENTO_MOCK[tipoRefeicao].hora}
                </span>
              </span>
            )}
            {isNutricionista && !turnoEncerradoPelaCozinha && (
              <span className="text-[11px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Aguardando Encerramento da Cozinha</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {isNutricionista ? "Conferência de Consumo Diário" : "Registro de Insumos da Cozinha"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isNutricionista
              ? "Valide os insumos lançados pela equipe da cozinha ou retifique as quantidades consumidas."
              : "Lance as quantidades utilizadas no preparo para baixa direta e balanço diário."}
          </p>
        </div>

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

      {/* BANNER DE AVISO DISCRETO (SÓ PARA A COZINHA) */}
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

      {/* BARRA DE CONTROLE DE AUDITORIA DO NUTRICIONISTA */}
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

      {/* 2. CARD DO CARDÁPIO */}
      <CardapioCard refeicao={tipoRefeicao} descricao={cardapioAtual} />

      {/* Alerta de Sucesso */}
      {feedbackSucesso && (
        <div className="p-4 sm:p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 sm:gap-4 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">
              {isNutricionista
                ? "Conferência e retificações salvas com sucesso!"
                : "Consumo salvo com sucesso!"}
            </p>
            <p className="text-xs text-emerald-100">
              {isNutricionista
                ? "Os ajustes no saldo de estoque foram consolidados."
                : `As baixas deste ${tipoRefeicao} foram registradas.`}
            </p>
          </div>
        </div>
      )}

      {/* 3. FORMULÁRIO COM SEÇÕES */}
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
                    const desabilitado = isNutricionista && !modoEdicaoNutri;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                          emUso ? "bg-emerald-50/40" : "hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                emUso ? "bg-emerald-600 scale-125" : "bg-slate-300"
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

                          <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-xs rounded-md shrink-0">
                            {item.unidade}
                          </span>
                        </div>

                        <div className="flex items-center justify-end">
                          <div
                            className={`flex items-center border-2 rounded-xl bg-white shadow-2xs overflow-hidden w-full sm:w-auto justify-between sm:justify-start ${
                              desabilitado
                                ? "border-slate-200 bg-slate-50 opacity-80"
                                : "border-slate-300 focus-within:border-emerald-600"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, -0.5)}
                              disabled={desabilitado || item.quantidadeUsada <= 0}
                              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              disabled={desabilitado}
                              value={item.quantidadeUsada || ""}
                              placeholder="0"
                              onChange={(e) =>
                                definirQuantidadeDireta(item.id, e.target.value)
                              }
                              className="w-20 sm:w-24 text-center font-black text-slate-900 text-base sm:text-lg py-2 bg-transparent focus:outline-none disabled:text-slate-600"
                            />

                            <button
                              type="button"
                              onClick={() => alterarQuantidade(item.id, 0.5)}
                              disabled={desabilitado}
                              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
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

        {/* 4. OBSERVAÇÕES E SOBRAS */}
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
            placeholder="Ex.: Sobra de 3kg de arroz; ajustada quantidade de sal..."
            className="w-full border-2 border-slate-200 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors disabled:bg-slate-50 disabled:text-slate-600"
          />
        </div>

        <div className="h-16 w-full" aria-hidden="true" />

        {/* 5. BARRA FLUTUANTE DE ENCERRAMENTO */}
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
                  {isNutricionista ? `Registrados no ${tipoRefeicao}` : `Para o ${tipoRefeicao}`}
                </p>
              </div>
            </div>

            {!isNutricionista && (
              <button
                type="button"
                onClick={() =>
                  setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })))
                }
                className="sm:hidden text-xs font-bold text-slate-400 hover:text-slate-700 underline"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isNutricionista && (
              <button
                type="button"
                onClick={() =>
                  setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })))
                }
                className="hidden sm:inline-block px-4 py-3 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}

            <button
              type="submit"
              disabled={isNutricionista ? !modoEdicaoNutri : totalLancados === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-sm sm:text-base font-extrabold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>
                {isNutricionista ? "Salvar Retificações" : "Registrar Consumo"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}