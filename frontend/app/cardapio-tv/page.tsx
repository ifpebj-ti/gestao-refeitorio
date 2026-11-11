"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  extrairTextoRefeicao,
  limparQuantidadesParaRefeitorio,
} from "@/app/cardapio/page";

type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
type TipoRefeicaoChave = "cafe" | "almoco" | "jantar";

const STORAGE_KEY = "@gestao_refeitorio:cardapio_semanal";

const DIAS_NOMES: Record<number, DiaSemana> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
};

const INFO_REFEICOES: Record<
  TipoRefeicaoChave,
  { titulo: string; horarioPadrao: string }
> = {
  cafe: {
    titulo: "Café da Manhã",
    horarioPadrao: "07:00 às 08:30",
  },
  almoco: {
    titulo: "Almoço",
    horarioPadrao: "11:30 às 13:30",
  },
  jantar: {
    titulo: "Jantar",
    horarioPadrao: "17:30 às 19:00",
  },
};

function obterRefeicaoAtivaPorHorario(agora: Date): TipoRefeicaoChave {
  const horas = agora.getHours();
  const minutos = agora.getMinutes();
  const tempoMinutos = horas * 60 + minutos;

  if (tempoMinutos < 10 * 60) {
    return "cafe";
  } else if (tempoMinutos < 14 * 60 + 30) {
    return "almoco";
  } else {
    return "jantar";
  }
}

export default function CardapioTvPage() {
  const [abaAtiva, setAbaAtiva] = useState<"cozinha" | "refeitorio">("cozinha");
  const [copiado, setCopiado] = useState(false);
  const [origemUrl, setOrigemUrl] = useState("");
  const [diaSemana, setDiaSemana] = useState<DiaSemana>("Segunda");
  const [refeicaoAtiva, setRefeicaoAtiva] = useState<TipoRefeicaoChave>("almoco");
  const [textoRefeicao, setTextoRefeicao] = useState("");
  const [horarioRefeicao, setHorarioRefeicao] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigemUrl(window.location.origin);

      const agora = new Date();
      const diaNum = agora.getDay();
      const diaDetectado = DIAS_NOMES[diaNum] || "Segunda";
      setDiaSemana(diaDetectado);

      const refChave = obterRefeicaoAtivaPorHorario(agora);
      setRefeicaoAtiva(refChave);

      // Carrega dados da refeição de hoje no cardápio semanal
      try {
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        const dataIso = `${ano}-${mes}-${dia}`;

        let dadosRef: any = null;
        const chaveData = `@gestao_refeitorio:cardapio_data_${dataIso}`;
        const salvoDatado = localStorage.getItem(chaveData);
        if (salvoDatado) {
          const parsedDatado = JSON.parse(salvoDatado);
          if (parsedDatado && parsedDatado[refChave]) {
            dadosRef = parsedDatado[refChave];
          }
        }

        if (!dadosRef) {
          const salvoSemanal = localStorage.getItem(STORAGE_KEY);
          if (salvoSemanal) {
            const parsed = JSON.parse(salvoSemanal);
            if (parsed[diaDetectado] && parsed[diaDetectado][refChave]) {
              dadosRef = parsed[diaDetectado][refChave];
            }
          }
        }

        if (dadosRef) {
          setHorarioRefeicao(dadosRef.horario?.trim() || INFO_REFEICOES[refChave].horarioPadrao);
          const texto = extrairTextoRefeicao(dadosRef);
          setTextoRefeicao(texto);
        } else {
          setHorarioRefeicao(INFO_REFEICOES[refChave].horarioPadrao);
          setTextoRefeicao("");
        }
      } catch (e) {
        console.error("Erro ao carregar prévia do cardápio:", e);
      }
    }
  }, []);

  const rotaAtual = abaAtiva === "cozinha" ? "/tv" : "/tv/refeitorio";
  const urlTv = origemUrl ? `${origemUrl}${rotaAtual}` : rotaAtual;

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

  const infoRef = INFO_REFEICOES[refeicaoAtiva];
  const linhasTexto = textoRefeicao
    .split("\n")
    .map((l) =>
      abaAtiva === "refeitorio" ? limparQuantidadesParaRefeitorio(l.trim()) : l.trim()
    )
    .filter(Boolean);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO LIMPO E DIRETO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transmissão nas TVs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Links de transmissão automática para a TV da Cozinha e para a TV do Refeitório (Alunos).
          </p>
        </div>

        {/* Seletor de Abas: TV da Cozinha vs TV do Refeitório */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setAbaAtiva("cozinha");
              setCopiado(false);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              abaAtiva === "cozinha"
                ? "bg-white text-emerald-800 shadow-2xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            TV da Cozinha
          </button>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva("refeitorio");
              setCopiado(false);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              abaAtiva === "refeitorio"
                ? "bg-white text-emerald-800 shadow-2xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            TV do Refeitório
          </button>
        </div>
      </div>

      {/* 2. CARD DO LINK DA ABA ATIVA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm sm:text-base">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>
              {abaAtiva === "cozinha"
                ? "Link da TV da Cozinha (Com quantidades)"
                : "Link da TV do Refeitório — Alunos (Sem quantidades)"}
            </span>
          </div>

          <Link
            href={rotaAtual}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
          >
            <span>Abrir tela da TV</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {abaAtiva === "cozinha"
            ? "Exibe o cardápio completo da refeição do horário com as quantidades e observações operacionais para a equipe da cozinha."
            : "Exibe apenas os pratos e itens servidos em cada refeição para os estudantes no refeitório, ocultando automaticamente as quantidades de preparo."}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={urlTv}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none select-all"
          />

          <button
            type="button"
            onClick={handleCopiarLink}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? "Link Copiado!" : "Copiar Link"}</span>
          </button>
        </div>
      </div>

      {/* 3. STATUS DA TRANSMISSÃO AO VIVO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Transmitindo Agora na{" "}
              {abaAtiva === "cozinha" ? "TV da Cozinha" : "TV do Refeitório"} ({diaSemana})
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{infoRef.titulo} • {horarioRefeicao || infoRef.horarioPadrao}</span>
          </div>
        </div>

        {/* Prévia do que está no ar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          {linhasTexto.length > 0 ? (
            <div className="space-y-2">
              {linhasTexto.map((linha, idx) => (
                <p key={idx} className="text-xs sm:text-sm font-bold text-slate-900">
                  {linha}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 italic">
              Nenhum item cadastrado no Cardápio Semanal para a refeição deste horário. As alterações salvas na aba &quot;Cardápio Semanal&quot; refletem instantaneamente na TV.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Sincronização 100% direta com a aba Cardápio Semanal
          </span>
          <Link
            href="/cardapio"
            className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
          >
            Editar Cardápio Semanal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
