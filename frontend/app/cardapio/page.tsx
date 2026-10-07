"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Coffee,
  SunMedium,
  Moon,
  Clock,
  Edit3,
  Check,
  CheckCircle2,
  Calendar,
  Users,
  Utensils,
  RotateCcw,
} from "lucide-react";

type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
type TipoRefeicaoChave = "cafe" | "almoco" | "jantar";

export interface ItemLinhaCardapio {
  id: string;
  nome: string;
  quantidade?: string;
}

export interface InsumoPlanejado {
  produtoId: string;
  nome: string;
  unidadeMedida: string;
  quantidadeTotal: number;
}

export interface RefeicaoCardapio {
  horario?: string;
  texto?: string;
  itens?: ItemLinhaCardapio[];
  itensSalada?: ItemLinhaCardapio[];
  observacoes?: string;
  quantidadePessoas?: string;
  // Campos retrocompatíveis para não quebrar cardápios pré-existentes:
  pratoPrincipal?: string;
  acompanhamentos?: string;
  saladaSobremesa?: string;
  bebida?: string;
  insumosPlanejados?: InsumoPlanejado[];
}

interface DiaCardapio {
  cafe: RefeicaoCardapio;
  almoco: RefeicaoCardapio;
  jantar: RefeicaoCardapio;
}

const DIAS_SEMANA: DiaSemana[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

const DIAS_NOMES: Record<number, DiaSemana> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
};

const toLocalDateInputString = (d: Date) => {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

function getSegundaDaSemana(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Domingo, 1 = Segunda ... 6 = Sábado

  // No fim de semana (Sábado ou Domingo), o planejamento escolar padrão é para a próxima Segunda letiva
  if (day === 6) {
    const seg = new Date(date);
    seg.setDate(date.getDate() + 2);
    seg.setHours(0, 0, 0, 0);
    return seg;
  }
  if (day === 0) {
    const seg = new Date(date);
    seg.setDate(date.getDate() + 1);
    seg.setHours(0, 0, 0, 0);
    return seg;
  }

  const diff = date.getDate() - day + 1;
  const segunda = new Date(date.setDate(diff));
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

function calcularDadosDia(segunda: Date, offsetDias: number) {
  const d = new Date(segunda);
  d.setDate(segunda.getDate() + offsetDias);
  const hoje = new Date();
  const isHoje =
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear();

  const diaStr = String(d.getDate()).padStart(2, "0");
  const mesStr = String(d.getMonth() + 1).padStart(2, "0");

  return {
    data: d,
    dataFormatada: `${diaStr}/${mesStr}`,
    isHoje,
  };
}

export function converterParaItensLinha(ref?: RefeicaoCardapio): ItemLinhaCardapio[] {
  if (!ref) return [];
  if (Array.isArray(ref.itens)) {
    return ref.itens.map((it, idx) => ({
      ...it,
      id: it.id || `item-gen-${idx}-${Date.now()}`,
    }));
  }

  // Conversão retrocompatível para dados legados
  const lista: ItemLinhaCardapio[] = [];
  let contador = 1;

  if (ref.saladaSobremesa?.trim()) {
    lista.push({
      id: `leg-sal-${contador++}`,
      nome: `Salada: ${ref.saladaSobremesa.trim()}`,
      quantidade: "",
    });
  }

  if (ref.pratoPrincipal?.trim()) {
    lista.push({
      id: `leg-prat-${contador++}`,
      nome: ref.pratoPrincipal.trim(),
      quantidade: "",
    });
  }

  if (ref.acompanhamentos?.trim()) {
    lista.push({
      id: `leg-acomp-${contador++}`,
      nome: ref.acompanhamentos.trim(),
      quantidade: "",
    });
  }

  if (ref.insumosPlanejados && Array.isArray(ref.insumosPlanejados)) {
    for (const ins of ref.insumosPlanejados) {
      lista.push({
        id: `leg-ins-${contador++}`,
        nome: ins.nome,
        quantidade: `${ins.quantidadeTotal} ${ins.unidadeMedida}`,
      });
    }
  }

  if (ref.bebida?.trim()) {
    lista.push({
      id: `leg-beb-${contador++}`,
      nome: ref.bebida.trim(),
      quantidade: "",
    });
  }

  return lista;
}

export function converterParaItensLinhaSalada(ref?: RefeicaoCardapio): ItemLinhaCardapio[] {
  if (!ref) return [];
  if (Array.isArray(ref.itensSalada)) {
    return ref.itensSalada.map((it, idx) => ({
      ...it,
      id: it.id || `sal-gen-${idx}-${Date.now()}`,
    }));
  }
  return [];
}

export function extrairTextoRefeicao(ref?: RefeicaoCardapio): string {
  if (!ref) return "";
  if (typeof ref.texto === "string" && ref.texto.trim()) {
    return ref.texto;
  }
  const linhas: string[] = [];
  if (ref.itensSalada && ref.itensSalada.length > 0) {
    linhas.push("Salada:");
    const vegetais = ref.itensSalada
      .filter((s) => s.nome?.trim())
      .map((s) => (s.quantidade?.trim() ? `${s.nome.trim()} (${s.quantidade.trim()})` : s.nome.trim()));
    if (vegetais.length > 0) {
      linhas.push(vegetais.join(" + "));
      linhas.push("");
    }
  }
  if (ref.itens && ref.itens.length > 0) {
    for (const it of ref.itens) {
      if (!it.nome?.trim()) continue;
      const qtd = it.quantidade?.trim() ? ` (${it.quantidade.trim()})` : "";
      linhas.push(`- ${it.nome.trim()}${qtd}`);
    }
  } else {
    // Retrocompatibilidade com dados legados
    if (ref.saladaSobremesa?.trim()) {
      linhas.push("Salada:");
      linhas.push(ref.saladaSobremesa.trim());
      linhas.push("");
    }
    if (ref.pratoPrincipal?.trim()) linhas.push(`- ${ref.pratoPrincipal.trim()}`);
    if (ref.acompanhamentos?.trim()) linhas.push(`- ${ref.acompanhamentos.trim()}`);
    if (ref.insumosPlanejados && Array.isArray(ref.insumosPlanejados)) {
      for (const ins of ref.insumosPlanejados) {
        linhas.push(`- ${ins.nome} (${ins.quantidadeTotal} ${ins.unidadeMedida})`);
      }
    }
    if (ref.bebida?.trim()) linhas.push(`- ${ref.bebida.trim()}`);
  }
  return linhas.join("\n").trim();
}

export function parseTextoParaItens(texto: string): {
  itens: ItemLinhaCardapio[];
  itensSalada: ItemLinhaCardapio[];
} {
  const linhas = (texto || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const itens: ItemLinhaCardapio[] = [];
  const itensSalada: ItemLinhaCardapio[] = [];
  let emSalada = false;

  for (const linha of linhas) {
    if (linha.toLowerCase().startsWith("salada:")) {
      emSalada = true;
      const conteudoSalada = linha.replace(/^salada:\s*/i, "").trim();
      if (conteudoSalada) {
        const partes = conteudoSalada.split("+");
        for (const p of partes) {
          const pt = p.trim();
          if (!pt) continue;
          const matchQtd = pt.match(/\(([^)]+)\)/);
          const nome = pt.replace(/\([^)]+\)/, "").trim();
          const qtd = matchQtd ? matchQtd[1].trim() : "";
          itensSalada.push({ id: `sal-${itensSalada.length + 1}`, nome, quantidade: qtd });
        }
      }
      continue;
    }

    if (emSalada && !linha.startsWith("-")) {
      const partes = linha.split("+");
      for (const p of partes) {
        const pt = p.trim();
        if (!pt) continue;
        const matchQtd = pt.match(/\(([^)]+)\)/);
        const nome = pt.replace(/\([^)]+\)/, "").trim();
        const qtd = matchQtd ? matchQtd[1].trim() : "";
        itensSalada.push({ id: `sal-${itensSalada.length + 1}`, nome, quantidade: qtd });
      }
      continue;
    }

    // Linha de prato/item
    emSalada = false;
    const limpo = linha.replace(/^-\s*/, "").trim();
    const matchQtd = limpo.match(/\(([^)]+)\)/);
    const nome = limpo.replace(/\([^)]+\)/, "").trim();
    const qtd = matchQtd ? matchQtd[1].trim() : "";
    itens.push({ id: `item-${itens.length + 1}`, nome, quantidade: qtd });
  }

  return { itens, itensSalada };
}

const criarRefeicaoVazia = (): RefeicaoCardapio => ({
  texto: "",
  quantidadePessoas: "",
  observacoes: "",
  itens: [],
  itensSalada: [],
});

const criarDiaVazio = (): DiaCardapio => ({
  cafe: criarRefeicaoVazia(),
  almoco: criarRefeicaoVazia(),
  jantar: criarRefeicaoVazia(),
});

const CARDAPIO_INICIAL: Record<DiaSemana, DiaCardapio> = {
  Segunda: criarDiaVazio(),
  Terça: criarDiaVazio(),
  Quarta: criarDiaVazio(),
  Quinta: criarDiaVazio(),
  Sexta: criarDiaVazio(),
};

const STORAGE_KEY = "@gestao_refeitorio:cardapio_semanal";

const INFO_REFEICOES: Record<
  TipoRefeicaoChave,
  {
    titulo: string;
    horario: string;
    icon: typeof Coffee;
    corIcone: string;
  }
> = {
  cafe: {
    titulo: "Café da Manhã",
    horario: "07:00 às 08:30",
    icon: Coffee,
    corIcone: "text-amber-700 bg-amber-50 border-amber-200",
  },
  almoco: {
    titulo: "Almoço",
    horario: "11:30 às 13:30",
    icon: SunMedium,
    corIcone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  jantar: {
    titulo: "Jantar",
    horario: "17:30 às 19:00",
    icon: Moon,
    corIcone: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
};

export default function CardapioSemanalPage() {
  const { perfil, usuario } = useAuth();
  const isNutricionista = perfil === "NUTRICIONISTA";

  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("Segunda");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cardapio, setCardapio] = useState<Record<DiaSemana, DiaCardapio>>(CARDAPIO_INICIAL);
  const [feedbackSalvo, setFeedbackSalvo] = useState(false);

  useEffect(() => {
    const agora = new Date();
    const diaNum = agora.getDay();
    if (diaNum === 6 || diaNum === 0) {
      const diasAteSegunda = diaNum === 6 ? 2 : 1;
      const proximaSegunda = new Date(agora);
      proximaSegunda.setDate(agora.getDate() + diasAteSegunda);
      setDataReferencia(proximaSegunda);
      setDiaSelecionado("Segunda");
    } else {
      setDataReferencia(agora);
      if (DIAS_NOMES[diaNum]) {
        setDiaSelecionado(DIAS_NOMES[diaNum]);
      } else {
        setDiaSelecionado("Segunda");
      }
    }
  }, []);

  const segundaSemana = getSegundaDaSemana(dataReferencia);
  const datasSemana: Record<DiaSemana, { data: Date; dataFormatada: string; isHoje: boolean }> = {
    Segunda: calcularDadosDia(segundaSemana, 0),
    Terça: calcularDadosDia(segundaSemana, 1),
    Quarta: calcularDadosDia(segundaSemana, 2),
    Quinta: calcularDadosDia(segundaSemana, 3),
    Sexta: calcularDadosDia(segundaSemana, 4),
  };

  const handleMudarData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [ano, mes, dia] = val.split("-").map(Number);
    const novaData = new Date(ano, mes - 1, dia, 12, 0, 0);
    const diaNum = novaData.getDay();
    if (diaNum === 6 || diaNum === 0) {
      const diasAteSegunda = diaNum === 6 ? 2 : 1;
      const proximaSeg = new Date(novaData);
      proximaSeg.setDate(novaData.getDate() + diasAteSegunda);
      setDataReferencia(proximaSeg);
      setDiaSelecionado("Segunda");
    } else {
      setDataReferencia(novaData);
      if (DIAS_NOMES[diaNum]) {
        setDiaSelecionado(DIAS_NOMES[diaNum]);
      }
    }
  };

  const irParaHoje = () => {
    const agora = new Date();
    const diaNum = agora.getDay();
    if (diaNum === 6 || diaNum === 0) {
      const diasAteSegunda = diaNum === 6 ? 2 : 1;
      const proximaSegunda = new Date(agora);
      proximaSegunda.setDate(agora.getDate() + diasAteSegunda);
      setDataReferencia(proximaSegunda);
      setDiaSelecionado("Segunda");
    } else {
      setDataReferencia(agora);
      if (DIAS_NOMES[diaNum]) {
        setDiaSelecionado(DIAS_NOMES[diaNum]);
      } else {
        setDiaSelecionado("Segunda");
      }
    }
  };

  const handleSelecionarDia = (dia: DiaSemana) => {
    setDiaSelecionado(dia);
    const info = datasSemana[dia];
    if (info) {
      setDataReferencia(new Date(info.data));
    }
  };

  // Carrega cardápio salvo no localStorage (descarta automaticamente mocks antigos de desenvolvimento)
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        const ehMockAntigo =
          JSON.stringify(parsed).includes("seg-c1") ||
          JSON.stringify(parsed).includes("ter-c1") ||
          JSON.stringify(parsed).includes("qua-c1");
        if (ehMockAntigo) {
          localStorage.removeItem(STORAGE_KEY);
          setCardapio(CARDAPIO_INICIAL);
          return;
        }
        setCardapio(parsed);
      } else {
        setCardapio(CARDAPIO_INICIAL);
      }
    } catch (e) {
      console.error("Erro ao carregar cardápio salvo:", e);
      setCardapio(CARDAPIO_INICIAL);
    }
  }, []);

  const handleAtualizarTextoRefeicao = (
    refeicao: TipoRefeicaoChave,
    novoTexto: string
  ) => {
    setCardapio((prev) => {
      const refeicaoAtual = prev[diaSelecionado][refeicao];
      const { itens, itensSalada } = parseTextoParaItens(novoTexto);
      const novoCardapio = {
        ...prev,
        [diaSelecionado]: {
          ...prev[diaSelecionado],
          [refeicao]: {
            ...refeicaoAtual,
            texto: novoTexto,
            itens,
            itensSalada,
          },
        },
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(novoCardapio));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
      } catch (e) {
        console.error("Erro ao salvar cardápio:", e);
      }

      return novoCardapio;
    });
  };

  const handleAtualizarCampo = (
    refeicao: TipoRefeicaoChave,
    campo: "observacoes" | "quantidadePessoas" | "horario",
    valor: string
  ) => {
    setCardapio((prev) => {
      const refeicaoAtual = prev[diaSelecionado][refeicao];
      return {
        ...prev,
        [diaSelecionado]: {
          ...prev[diaSelecionado],
          [refeicao]: {
            ...refeicaoAtual,
            [campo]: valor,
          },
        },
      };
    });
  };

  const handleSalvarCardapio = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cardapio));
      if (usuario?.nome) {
        localStorage.setItem(
          "@gestao_refeitorio:cardapio_nutricionista",
          `Nutricionista ${usuario.nome}`
        );
      }

      // Salva snapshot datado para os dias da semana de referência como evidência histórica perene
      for (const dia of DIAS_SEMANA) {
        const info = datasSemana[dia];
        if (info && info.data) {
          const ano = info.data.getFullYear();
          const mes = String(info.data.getMonth() + 1).padStart(2, "0");
          const dStr = String(info.data.getDate()).padStart(2, "0");
          const iso = `${ano}-${mes}-${dStr}`;
          localStorage.setItem(`@gestao_refeitorio:cardapio_data_${iso}`, JSON.stringify(cardapio[dia]));
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
      setFeedbackSalvo(true);
      setModoEdicao(false);
      setTimeout(() => setFeedbackSalvo(false), 3500);
    } catch (e) {
      console.error("Erro ao salvar cardápio:", e);
    }
  };

  const handleLimparGrade = () => {
    if (confirm("Deseja realmente limpar todos os itens cadastrados no cardápio semanal?")) {
      setCardapio(CARDAPIO_INICIAL);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(CARDAPIO_INICIAL));
        const chavesParaRemover: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("@gestao_refeitorio:cardapio_data_") || k.startsWith("@gestao_refeitorio:consumo_"))) {
            chavesParaRemover.push(k);
          }
        }
        chavesParaRemover.forEach((k) => localStorage.removeItem(k));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
      } catch (e) {
        console.error("Erro ao limpar cardápio:", e);
      }
    }
  };

  const diaAtualDados = cardapio[diaSelecionado];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-24">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cardápio Semanal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Defina os pratos e quantidades livremente em texto aberto, sincronizando com a Cozinha e a TV.
            </p>
          </div>
        </div>

        {/* Botão de Edição / Salvar */}
        {isNutricionista && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {modoEdicao ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLimparGrade}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
                  title="Limpar todos os itens cadastrados no cardápio"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Limpar Grade</span>
                </button>
                <button
                  type="button"
                  onClick={handleSalvarCardapio}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setModoEdicao(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Editar Cardápio</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* FEEDBACK DE SUCESSO */}
      {feedbackSalvo && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">Cardápio salvo com sucesso!</p>
            <p className="text-xs text-emerald-100 mt-0.5">
              As quantidades e insumos foram sincronizados com o Consumo da Cozinha e a exibição da TV.
            </p>
          </div>
        </div>
      )}

      {/* 2. SELETOR DE DATA REAL & DIAS DA SEMANA */}
      <div className="space-y-2.5">
        {/* Banner informativo quando hoje for fim de semana */}
        {(() => {
          const hojeReal = new Date();
          const diaNumReal = hojeReal.getDay();
          const isFimDeSemana = diaNumReal === 6 || diaNumReal === 0;
          if (!isFimDeSemana) return null;
          const nomeHoje = diaNumReal === 6 ? "Sábado" : "Domingo";
          const dataStr = `${String(hojeReal.getDate()).padStart(2, "0")}/${String(hojeReal.getMonth() + 1).padStart(2, "0")}`;
          return (
            <div className="flex items-center gap-2 p-2.5 px-3.5 bg-amber-50/90 border border-amber-200 text-amber-950 rounded-xl text-xs shadow-2xs">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hoje é <strong>{nomeHoje} ({dataStr})</strong>. Fora do período letivo, exibindo planejamento para a <strong>próxima semana ({datasSemana.Segunda.dataFormatada} a {datasSemana.Sexta.dataFormatada})</strong>.
              </span>
            </div>
          );
        })()}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">Data de Referência:</span>
              <input
                type="date"
                value={toLocalDateInputString(dataReferencia)}
                onChange={handleMudarData}
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={irParaHoje}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer self-start sm:self-auto border border-slate-200"
            title="Ir para o dia atual ou próxima semana útil"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hoje</span>
          </button>
        </div>

        {/* Botões dos dias da semana com datas reais */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DIAS_SEMANA.map((dia) => {
            const ativo = diaSelecionado === dia;
            const info = datasSemana[dia];
            return (
              <button
                key={dia}
                type="button"
                onClick={() => handleSelecionarDia(dia)}
                className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border text-center flex flex-col items-center justify-center gap-0.5 ${
                  ativo
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold">{dia}</span>
                  {info?.isHoje && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                        ativo ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      Hoje
                    </span>
                  )}
                </div>
                {info && (
                  <span
                    className={`text-[11px] font-medium ${
                      ativo ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    {info.dataFormatada}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. AS REFEIÇÕES DO DIA (Café da Manhã primeiro, depois Almoço e Jantar) */}
      <div className="space-y-6">
        {(["cafe", "almoco", "jantar"] as const).map((chave) => {
          const info = INFO_REFEICOES[chave];
          const dadosRef = diaAtualDados[chave];
          const Icon = info.icon;

            const horarioCustomizado = dadosRef.horario?.trim() || info.horario;

            return (
              <CardRefeicaoAberta
                key={chave}
                tipoChave={chave}
                diaNome={diaSelecionado}
                tituloRefeicao={info.titulo}
                horarioRefeicao={horarioCustomizado}
                corIcone={info.corIcone}
                Icone={Icon}
                dadosRefeicao={dadosRef}
                modoEdicao={modoEdicao}
                onAtualizarTexto={(novoTexto) => handleAtualizarTextoRefeicao(chave, novoTexto)}
                onAtualizarCampo={(campo, valor) => handleAtualizarCampo(chave, campo, valor)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================================
  // COMPONENTE: Campo Aberto Livre para Cardápio (Estilo Documento do IFPE / WhatsApp)
  // Simples, rápido e sem complicações de colunas
  // =========================================================================================
  function CardRefeicaoAberta({
    tipoChave,
    diaNome,
    tituloRefeicao,
    horarioRefeicao,
    corIcone,
    Icone,
    dadosRefeicao,
    modoEdicao,
    onAtualizarTexto,
    onAtualizarCampo,
  }: {
    tipoChave: TipoRefeicaoChave;
    diaNome: DiaSemana;
    tituloRefeicao: string;
    horarioRefeicao: string;
    corIcone: string;
    Icone: typeof Coffee;
    dadosRefeicao: RefeicaoCardapio;
    modoEdicao: boolean;
    onAtualizarTexto: (novoTexto: string) => void;
    onAtualizarCampo: (campo: "observacoes" | "quantidadePessoas" | "horario", valor: string) => void;
  }) {
    const textoAtual = extrairTextoRefeicao(dadosRefeicao);
    const linhasTexto = textoAtual
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);


    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Topo da Refeição */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${corIcone}`}>
              <Icone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {tituloRefeicao}
                </h2>
                {modoEdicao ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-lg shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <input
                      type="text"
                      value={dadosRefeicao.horario ?? horarioRefeicao}
                      onChange={(e) => onAtualizarCampo("horario", e.target.value)}
                      placeholder={horarioRefeicao}
                      className="w-32 text-xs font-bold text-amber-950 bg-white border border-amber-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                      title="Horário da refeição (100% mutável)"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {horarioRefeicao}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cardápio para {diaNome}.
              </p>
            </div>
          </div>

        {/* Quantidade de Pessoas */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {modoEdicao ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-600">Pessoas:</span>
              <input
                type="text"
                value={dadosRefeicao.quantidadePessoas || ""}
                onChange={(e) => onAtualizarCampo("quantidadePessoas", e.target.value)}
                placeholder=""
                className="w-16 font-extrabold text-xs text-slate-800 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center focus:outline-none focus:border-emerald-600"
                title="Previsão de pessoas para esta refeição"
              />
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {dadosRefeicao.quantidadePessoas
                  ? `${dadosRefeicao.quantidadePessoas} pessoas`
                  : "Previsão padrão"}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* MODO DE EDIÇÃO: Campo Aberto Livre (Textarea Confortável) */}
      {modoEdicao ? (
        <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cardápio & Preparos (Campo Aberto Livre)</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Digite ou cole as linhas livremente
            </span>
          </div>

          <textarea
            rows={tipoChave === "almoco" ? 11 : 8}
            value={textoAtual}
            onChange={(e) => onAtualizarTexto(e.target.value)}
            placeholder="Digite os itens do cardápio desta refeição..."
            className="w-full p-3.5 text-xs sm:text-sm font-medium leading-relaxed bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs text-slate-900 placeholder:text-slate-400 font-sans"
          />
        </div>
      ) : (
        /* MODO DE VISUALIZAÇÃO: Exibição Elegante e Formatada Estilo Folha do IFPE */
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
          {linhasTexto.length > 0 ? (
            <div className="space-y-2 text-xs sm:text-sm text-slate-800">
              {linhasTexto.map((linha, idx) => {
                const ehItemComTraco = linha.startsWith("-");

                if (ehItemComTraco) {
                  const limpo = linha.replace(/^-\s*/, "");
                  const matchQtd = limpo.match(/\(([^)]+)\)/);
                  const nome = limpo.replace(/\([^)]+\)/, "").trim();
                  const qtd = matchQtd ? matchQtd[1].trim() : "";

                  return (
                    <p key={idx} className="flex items-start gap-2 pl-1">
                      <span className="font-extrabold text-slate-900">-</span>
                      <span className="font-bold text-slate-950">{nome}</span>
                      {qtd && (
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-xs">
                          ({qtd})
                        </span>
                      )}
                    </p>
                  );
                }

                return (
                  <p key={idx} className="font-bold text-slate-900 pl-1">
                    {linha}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              Nenhum cardápio cadastrado ainda para esta refeição. Clique em &quot;Editar Cardápio&quot; para digitar os itens.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
