"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tv,
  Copy,
  Check,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import { extrairTextoRefeicao } from "@/app/cardapio/page";

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
  const [copiado, setCopiado] = useState(false);
  const [urlTv, setUrlTv] = useState("/tv");
  const [diaSemana, setDiaSemana] = useState<DiaSemana>("Segunda");
  const [refeicaoAtiva, setRefeicaoAtiva] = useState<TipoRefeicaoChave>("almoco");
  const [textoRefeicao, setTextoRefeicao] = useState("");
  const [horarioRefeicao, setHorarioRefeicao] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlTv(`${window.location.origin}/tv`);

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
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 pb-24">
      {/* 1. CABEÇALHO LIMPO E DIRETO */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            TV da Cozinha
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Link para a TV da cozinha com transmissão automática.
          </p>
        </div>
      </div>

      {/* 2. CARD DO LINK ÚNICO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm sm:text-base">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Link da exibição</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Este link transmite o cardápio automaticamente de acordo com o horário de cada refeição. Basta copiar e colocar no navegador da TV para visualizar.
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
              Transmitindo Agora na TV ({diaSemana})
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{infoRef.titulo} • {horarioRefeicao || infoRef.horarioPadrao}</span>
          </div>
        </div>

        {/* Prévia do que está no ar formatada exatamente como o cardápio */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          {linhasTexto.length > 0 ? (
            <div className="space-y-2">
              {linhasTexto.map((linha, idx) => {
                const ehItemComTraco = linha.startsWith("-");

                if (ehItemComTraco) {
                  const limpo = linha.replace(/^-\s*/, "");
                  const matchQtd = limpo.match(/\(([^)]+)\)/);
                  const nome = limpo.replace(/\([^)]+\)/, "").trim();
                  const qtd = matchQtd ? matchQtd[1].trim() : "";

                  return (
                    <p key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900">
                      <span className="font-extrabold text-emerald-700">•</span>
                      <span className="font-bold text-slate-950">{nome}</span>
                      {qtd && (
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 text-xs shrink-0">
                          ({qtd})
                        </span>
                      )}
                    </p>
                  );
                }

                const ehSalada = linha.toLowerCase().startsWith("salada");

                return (
                  <p
                    key={idx}
                    className={`text-xs sm:text-sm ${
                      ehSalada
                        ? "font-extrabold text-emerald-900 bg-emerald-100/70 p-2 rounded-lg border border-emerald-300"
                        : "font-bold text-slate-900"
                    }`}
                  >
                    {linha}
                  </p>
                );
              })}
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
