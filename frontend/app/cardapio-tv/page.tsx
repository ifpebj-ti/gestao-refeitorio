"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tv,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  SunMedium,
  Coffee,
  Moon,
  Eye,
  Radio,
} from "lucide-react";

type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
type TipoRefeicaoChave = "cafe" | "almoco" | "jantar";

const DIAS_SEMANA: DiaSemana[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const STORAGE_KEY = "@gestao_refeitorio:cardapio_semanal";
const KEY_REFEICAO_TV = "@gestao_refeitorio:refeicao_ativa_tv";

const DIAS_NOMES: Record<number, DiaSemana> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
};

interface ItemLinhaTv {
  id: string;
  nome: string;
  quantidade?: string;
}

interface RefeicaoCardapio {
  itens?: ItemLinhaTv[];
  pratoPrincipal?: string;
  acompanhamentos?: string;
  saladaSobremesa?: string;
  bebida?: string;
  observacoes?: string;
  quantidadePessoas?: string;
}

interface DiaCardapio {
  cafe?: RefeicaoCardapio;
  almoco?: RefeicaoCardapio;
  jantar?: RefeicaoCardapio;
}

const INFO_REFEICOES: Record<
  TipoRefeicaoChave,
  { titulo: string; horario: string; icon: typeof Coffee; corIcone: string }
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

const toLocalDateInputString = (d: Date) => {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

function getSegundaDaSemana(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();

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

function formatarTextoTv(ref?: RefeicaoCardapio): string {
  if (!ref) return "";
  if (ref.itens && Array.isArray(ref.itens) && ref.itens.length > 0) {
    const partes = ref.itens.map((it) => it.nome.trim()).filter(Boolean);
    if (ref.observacoes?.trim()) {
      partes.push(`OBS: ${ref.observacoes.trim()}`);
    }
    return partes.join(". ").toUpperCase();
  }
  const partes: string[] = [];
  if (ref.pratoPrincipal?.trim()) partes.push(ref.pratoPrincipal.trim());
  if (ref.acompanhamentos?.trim()) partes.push(`ACOMPANHAMENTOS: ${ref.acompanhamentos.trim()}`);
  if (ref.saladaSobremesa?.trim()) partes.push(`SALADA: ${ref.saladaSobremesa.trim()}`);
  if (ref.bebida?.trim()) partes.push(`BEBIDA: ${ref.bebida.trim()}`);
  if (ref.observacoes?.trim()) partes.push(`OBS: ${ref.observacoes.trim()}`);
  return partes.join(". ").toUpperCase();
}

export default function CardapioTvPage() {
  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("Segunda");
  const [cardapio, setCardapio] = useState<Record<DiaSemana, DiaCardapio> | null>(null);
  const [refeicaoTransmitida, setRefeicaoTransmitida] = useState<TipoRefeicaoChave | null>("almoco");
  const [feedbackTransmissao, setFeedbackTransmissao] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [urlTv, setUrlTv] = useState("/tv");

  const carregarDados = () => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        setCardapio(JSON.parse(salvo));
      } else {
        setCardapio(null);
      }

      const ativaSalva = localStorage.getItem(KEY_REFEICAO_TV);
      if (ativaSalva === "nenhuma") {
        setRefeicaoTransmitida(null);
      } else if (ativaSalva && ["cafe", "almoco", "jantar"].includes(ativaSalva)) {
        setRefeicaoTransmitida(ativaSalva as TipoRefeicaoChave);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do cardápio para TV:", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlTv(`${window.location.origin}/tv`);
    }

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

    carregarDados();

    // Sincronização 100% automática em tempo real com o cardápio semanal
    const handleStorage = () => carregarDados();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
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

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlTv);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const handleToggleRefeicao = (refeicao: TipoRefeicaoChave) => {
    if (refeicaoTransmitida === refeicao) {
      // Se clicou na refeição que já está ativa, desmarca e para de transmitir
      setRefeicaoTransmitida(null);
      try {
        localStorage.setItem(KEY_REFEICAO_TV, "nenhuma");
        window.dispatchEvent(new Event("storage"));
        setFeedbackTransmissao(`Transmissão de ${INFO_REFEICOES[refeicao].titulo} pausada.`);
        setTimeout(() => setFeedbackTransmissao(null), 3000);
      } catch (e) {
        console.error("Erro ao pausar transmissão da TV:", e);
      }
    } else {
      // Marca nova refeição para transmitir
      setRefeicaoTransmitida(refeicao);
      try {
        localStorage.setItem(KEY_REFEICAO_TV, refeicao);
        window.dispatchEvent(new Event("storage"));
        setFeedbackTransmissao(`Transmitindo agora na TV: ${INFO_REFEICOES[refeicao].titulo}`);
        setTimeout(() => setFeedbackTransmissao(null), 3000);
      } catch (e) {
        console.error("Erro ao salvar refeição ativa da TV:", e);
      }
    }
  };

  const dadosDia = cardapio ? cardapio[diaSelecionado] : undefined;
  const textoTransmitindoAtualmente = refeicaoTransmitida
    ? formatarTextoTv(dadosDia?.[refeicaoTransmitida])
    : "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-24">
      {/* 1. CABEÇALHO LIMPO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cardápio na TV
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sincronizado automaticamente com o Cardápio Semanal. Escolha qual refeição transmitir no monitor.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopiarLink}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-300 hover:border-emerald-600 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copiado ? "Link Copiado!" : "Copiar Link"}</span>
        </button>
      </div>

      {/* FEEDBACK DE TRANSMISSÃO */}
      {feedbackTransmissao && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-100" />
          <p className="font-bold text-xs sm:text-sm">{feedbackTransmissao}</p>
        </div>
      )}

      {/* 2. CARD DO STATUS DA TRANSMISSÃO (VERDE PADRÃO DO SISTEMA) */}
      <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-emerald-100 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {refeicaoTransmitida ? (
                <>Transmitindo na TV: <strong>{INFO_REFEICOES[refeicaoTransmitida].titulo}</strong></>
              ) : (
                <>Transmissão Pausada (Nenhuma refeição ativa no momento)</>
              )}
            </span>
          </div>

          <span className="text-[11px] font-semibold text-emerald-100 bg-emerald-700/80 px-2.5 py-0.5 rounded-md">
            {diaSelecionado}
          </span>
        </div>

        {/* Prévia do texto */}
        <div className="bg-emerald-700/70 border border-emerald-500/50 p-3.5 rounded-xl">
          <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
            {refeicaoTransmitida ? (
              textoTransmitindoAtualmente || (
                <span className="text-emerald-100 italic font-normal">
                  Nenhum item cadastrado para esta refeição no Cardápio Semanal.
                </span>
              )
            ) : (
              <span className="text-emerald-100 italic font-normal">
                Clique no botão de transmitir em uma das refeições abaixo para exibir na TV.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 3. SELETOR DE DATA REAL & DIAS DA SEMANA */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
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

          <button
            type="button"
            onClick={irParaHoje}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer self-start sm:self-auto border border-slate-200"
            title="Ir para o dia atual"
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

      {/* 4. AS 3 REFEIÇÕES DO DIA (COM TOGGLE PARA TRANSMITIR / PARAR) */}
      <div className="space-y-4">
        {(["almoco", "cafe", "jantar"] as const).map((chave) => {
          const info = INFO_REFEICOES[chave];
          const dadosRef = dadosDia?.[chave];
          const Icon = info.icon;
          const estaTransmitindo = refeicaoTransmitida === chave;
          const itens = dadosRef?.itens || [];

          return (
            <div
              key={chave}
              className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 transition-all ${
                estaTransmitindo
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${info.corIcone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{info.titulo}</h2>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {info.horario}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão de Transmitir com capacidade de Desmarcar / Parar */}
                <button
                  type="button"
                  onClick={() => handleToggleRefeicao(chave)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
                    estaTransmitindo
                      ? "bg-emerald-600 hover:bg-rose-600 text-white group"
                      : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-500"
                  }`}
                  title={estaTransmitindo ? "Clique para parar de transmitir" : `Transmitir ${info.titulo} na TV`}
                >
                  {estaTransmitindo ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="group-hover:hidden">Transmitindo na TV</span>
                      <span className="hidden group-hover:inline">Parar Transmissão</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-3.5 h-3.5 text-slate-500" />
                      <span>Transmitir na TV</span>
                    </>
                  )}
                </button>
              </div>

              {/* Exibição dos Itens Puxados do Cardápio */}
              {itens.length > 0 || dadosRef?.pratoPrincipal ? (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs sm:text-sm text-slate-800">
                  {itens.length > 0 ? (
                    itens.map((it) => (
                      <p key={it.id} className="flex items-start gap-2">
                        <span className="font-extrabold text-slate-900">-</span>
                        <span className="font-bold text-slate-950">{it.nome}</span>
                        {it.quantidade && (
                          <span className="font-medium text-emerald-800">
                            ({it.quantidade})
                          </span>
                        )}
                      </p>
                    ))
                  ) : (
                    <p className="font-bold text-slate-950">{dadosRef?.pratoPrincipal}</p>
                  )}

                  {dadosRef?.observacoes && (
                    <p className="text-slate-600 italic pt-1">
                      <strong className="text-slate-700 font-bold not-italic">Obs: </strong>
                      <span>{dadosRef.observacoes}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Nenhum item cadastrado no Cardápio Semanal para {info.titulo.toLowerCase()}.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
