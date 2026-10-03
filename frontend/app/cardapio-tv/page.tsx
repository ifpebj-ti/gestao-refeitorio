"use client";

import { useState, useEffect } from "react";
import {
  Tv,
  Copy,
  Check,
  CheckCircle2,
  SunMedium,
  Coffee,
  Moon,
  Radio,
  Sparkles,
} from "lucide-react";

type TipoRefeicaoChave = "cafe" | "almoco" | "jantar";

const KEY_REFEICAO_TV = "@gestao_refeitorio:refeicao_ativa_tv";

const INFO_REFEICOES: Record<
  TipoRefeicaoChave,
  { titulo: string; icon: typeof Coffee; corIcone: string }
> = {
  cafe: {
    titulo: "Café da Manhã",
    icon: Coffee,
    corIcone: "text-amber-700 bg-amber-50 border-amber-200",
  },
  almoco: {
    titulo: "Almoço",
    icon: SunMedium,
    corIcone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  jantar: {
    titulo: "Jantar",
    icon: Moon,
    corIcone: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
};

export default function CardapioTvPage() {
  const [refeicaoSelecionada, setRefeicaoSelecionada] = useState<TipoRefeicaoChave>("almoco");
  const [refeicaoAtivaTv, setRefeicaoAtivaTv] = useState<TipoRefeicaoChave | null>("almoco");
  const [textosRefeicoes, setTextosRefeicoes] = useState<Record<TipoRefeicaoChave, string>>({
    cafe: "",
    almoco: "",
    jantar: "",
  });
  const [feedbackSalvo, setFeedbackSalvo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [urlTv, setUrlTv] = useState("/tv");

  // Carrega os dados da TV salvos no localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlTv(`${window.location.origin}/tv`);

      try {
        const ativaSalva = localStorage.getItem(KEY_REFEICAO_TV);
        if (ativaSalva === "nenhuma") {
          setRefeicaoAtivaTv(null);
        } else if (ativaSalva && ["cafe", "almoco", "jantar"].includes(ativaSalva)) {
          const chave = ativaSalva as TipoRefeicaoChave;
          setRefeicaoAtivaTv(chave);
          setRefeicaoSelecionada(chave);
        }

        const tCafe = localStorage.getItem("@gestao_refeitorio:texto_tv_cafe") || "";
        const tAlmoco = localStorage.getItem("@gestao_refeitorio:texto_tv_almoco") || "";
        const tJantar = localStorage.getItem("@gestao_refeitorio:texto_tv_jantar") || "";

        setTextosRefeicoes({
          cafe: tCafe,
          almoco: tAlmoco,
          jantar: tJantar,
        });
      } catch (e) {
        console.error("Erro ao carregar textos da TV:", e);
      }
    }
  }, []);

  // Seleciona e transmite imediatamente a refeição escolhida para a TV
  const handleTransmitirRefeicao = (chave: TipoRefeicaoChave) => {
    setRefeicaoSelecionada(chave);
    setRefeicaoAtivaTv(chave);

    try {
      localStorage.setItem(KEY_REFEICAO_TV, chave);

      // Garante que o texto atual também fique persistido
      const textoAtual = textosRefeicoes[chave];
      localStorage.setItem(`@gestao_refeitorio:texto_tv_${chave}`, textoAtual);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      setFeedbackSalvo(`Transmitindo agora no telão: ${INFO_REFEICOES[chave].titulo}`);
      setTimeout(() => setFeedbackSalvo(null), 3000);
    } catch (e) {
      console.error("Erro ao transmitir refeição na TV:", e);
    }
  };

  // Salva automaticamente o texto da refeição conforme a nutricionista digita
  const handleTextoChange = (novoTexto: string) => {
    setTextosRefeicoes((prev) => ({
      ...prev,
      [refeicaoSelecionada]: novoTexto,
    }));

    try {
      localStorage.setItem(`@gestao_refeitorio:texto_tv_${refeicaoSelecionada}`, novoTexto);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Erro ao salvar texto da TV:", e);
    }
  };

  const handlePausarTransmissao = () => {
    try {
      localStorage.setItem(KEY_REFEICAO_TV, "nenhuma");
      setRefeicaoAtivaTv(null);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      setFeedbackSalvo("Transmissão do telão pausada.");
      setTimeout(() => setFeedbackSalvo(null), 3000);
    } catch (e) {
      console.error("Erro ao pausar transmissão da TV:", e);
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

  const textoAtualExibicao = textosRefeicoes[refeicaoSelecionada];
  const textoAtivoNoTelao = refeicaoAtivaTv ? textosRefeicoes[refeicaoAtivaTv] : "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-24">
      {/* 1. CABEÇALHO */}
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
              Escolha qual refeição transmitir no telão e digite o cardápio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopiarLink}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-300 hover:border-emerald-600 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
            title="Copiar link do telão da TV"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? "Link Copiado!" : "Copiar Link"}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE TRANSMISSÃO */}
      {feedbackSalvo && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-xl flex items-center gap-2.5 shadow-sm animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-100" />
          <p className="font-bold text-xs sm:text-sm">{feedbackSalvo}</p>
        </div>
      )}

      {/* 2. STATUS ATUAL DO TELÃO */}
      <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-emerald-100 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {refeicaoAtivaTv ? (
                <>Transmitindo no Telão: <strong>{INFO_REFEICOES[refeicaoAtivaTv].titulo}</strong></>
              ) : (
                <>Transmissão Pausada (Nenhuma refeição ativa no telão)</>
              )}
            </span>
          </div>

          {refeicaoAtivaTv && (
            <button
              type="button"
              onClick={handlePausarTransmissao}
              className="text-xs font-bold text-emerald-100 bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-emerald-500/60 self-start sm:self-auto"
            >
              Pausar Telão
            </button>
          )}
        </div>

        {/* Prévia do texto que está na TV agora */}
        <div className="bg-emerald-700/70 border border-emerald-500/50 p-3.5 rounded-xl">
          <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
            {refeicaoAtivaTv ? (
              textoAtivoNoTelao ? (
                textoAtivoNoTelao.split("\n").filter(Boolean).join(" • ").toUpperCase()
              ) : (
                <span className="text-emerald-100 italic font-normal">
                  Nenhum texto digitado para esta refeição. Digite no campo abaixo.
                </span>
              )
            ) : (
              <span className="text-emerald-100 italic font-normal">
                Telão pausado. Clique em uma refeição abaixo para transmitir no telão.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 3. BOTÕES PARA SELECIONAR E TRANSMITIR A REFEIÇÃO */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
            Selecione qual refeição transmitir no telão:
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Clique na refeição desejada para colocá-la imediatamente no telão.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["cafe", "almoco", "jantar"] as const).map((chave) => {
            const info = INFO_REFEICOES[chave];
            const Icon = info.icon;
            const ativaNoTelao = refeicaoAtivaTv === chave;
            const emEdicao = refeicaoSelecionada === chave;

            return (
              <button
                key={chave}
                type="button"
                onClick={() => handleTransmitirRefeicao(chave)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                  ativaNoTelao
                    ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm"
                    : emEdicao
                    ? "bg-slate-50 border-slate-300 shadow-2xs"
                    : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${info.corIcone}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {ativaNoTelao ? (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      Transmitindo
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 rounded-full transition-colors">
                      Clique p/ Transmitir
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {info.titulo}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CAMPO DE TEXTO ABERTO LIVRE COM AUTO-SAVE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>Cardápio: {INFO_REFEICOES[refeicaoSelecionada].titulo}</span>
              {refeicaoAtivaTv === refeicaoSelecionada && (
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  No Ar na TV
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Digite o cardápio. As alterações são salvas e sincronizadas automaticamente no telão em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 self-start sm:self-auto">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Salvo automaticamente</span>
          </div>
        </div>

        <div>
          <textarea
            rows={7}
            value={textoAtualExibicao}
            onChange={(e) => handleTextoChange(e.target.value)}
            placeholder="Exemplo: Arroz, Feijão Carioca, Frango Grelhado, Salada de Tomate com Alface..."
            className="w-full p-4 font-sans text-sm sm:text-base font-semibold leading-relaxed bg-slate-50/70 border-2 border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
