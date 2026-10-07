"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Utensils, Maximize2, Minimize2, Clock, Users } from "lucide-react";
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

/**
 * Determina a refeição ativa do momento de acordo com o horário do dia:
 * - Até 10:00: Café da Manhã
 * - 10:00 às 14:30: Almoço
 * - Após 14:30: Jantar
 */
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

export default function TvMuralPage() {
  const [dataAtualFormatada, setDataAtualFormatada] = useState<string>("");
  const [dataCurta, setDataCurta] = useState<string>("");
  const [horaFormatada, setHoraFormatada] = useState<string>("");
  const [diaSemana, setDiaSemana] = useState<DiaSemana>("Segunda");
  const [refeicaoAtiva, setRefeicaoAtiva] = useState<TipoRefeicaoChave>("almoco");
  const [telaCheia, setTelaCheia] = useState(false);

  // Dados carregados da refeição ativa
  const [horarioRefeicao, setHorarioRefeicao] = useState<string>("");
  const [quantidadePessoas, setQuantidadePessoas] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [textoRefeicao, setTextoRefeicao] = useState<string>("");

  // 1. Relógio em tempo real e cálculo da refeição ativa
  useEffect(() => {
    const atualizarHorario = () => {
      const agora = new Date();
      setDataAtualFormatada(
        agora.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );

      setDataCurta(
        agora.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        })
      );

      setHoraFormatada(
        agora.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      const diaNum = agora.getDay();
      const diaDetectado = DIAS_NOMES[diaNum] || "Segunda";
      setDiaSemana(diaDetectado);

      const novaRefeicao = obterRefeicaoAtivaPorHorario(agora);
      setRefeicaoAtiva(novaRefeicao);
    };

    atualizarHorario();
    const timer = setInterval(atualizarHorario, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Leitura e sincronização automática do cardápio semanal
  const carregarCardapio = () => {
    try {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, "0");
      const dia = String(agora.getDate()).padStart(2, "0");
      const dataIso = `${ano}-${mes}-${dia}`;

      const refChave = obterRefeicaoAtivaPorHorario(agora);

      let dadosRef: any = null;

      // 1. Prioridade: Snapshot datado do dia (se houver)
      const chaveData = `@gestao_refeitorio:cardapio_data_${dataIso}`;
      const salvoDatado = localStorage.getItem(chaveData);
      if (salvoDatado) {
        try {
          const parsedDatado = JSON.parse(salvoDatado);
          if (parsedDatado && parsedDatado[refChave]) {
            dadosRef = parsedDatado[refChave];
          }
        } catch {
          // segue para semanal
        }
      }

      // 2. Fallback: Cardápio Semanal
      if (!dadosRef) {
        const salvoSemanal = localStorage.getItem(STORAGE_KEY);
        if (salvoSemanal) {
          const parsed = JSON.parse(salvoSemanal);
          const diaDetectado = DIAS_NOMES[agora.getDay()] || "Segunda";
          if (parsed[diaDetectado] && parsed[diaDetectado][refChave]) {
            dadosRef = parsed[diaDetectado][refChave];
          }
        }
      }

      if (dadosRef) {
        setHorarioRefeicao(dadosRef.horario?.trim() || INFO_REFEICOES[refChave].horarioPadrao);
        setQuantidadePessoas(dadosRef.quantidadePessoas?.trim() || "");
        setObservacoes(dadosRef.observacoes?.trim() || "");
        const texto = extrairTextoRefeicao(dadosRef);
        setTextoRefeicao(texto);
        return;
      }
    } catch (e) {
      console.error("Erro ao ler cardápio para a TV da Cozinha:", e);
    }

    setTextoRefeicao("");
    setObservacoes("");
    setQuantidadePessoas("");
    setHorarioRefeicao(INFO_REFEICOES[refeicaoAtiva].horarioPadrao);
  };

  useEffect(() => {
    carregarCardapio();
    // Atualização contínua a cada 10 segundos
    const interval = setInterval(carregarCardapio, 10000);
    window.addEventListener("storage", carregarCardapio);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", carregarCardapio);
    };
  }, [diaSemana, refeicaoAtiva]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setTelaCheia(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setTelaCheia(false);
    }
  };

  const infoAtual = INFO_REFEICOES[refeicaoAtiva];

  const linhasTexto = textoRefeicao
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100 flex flex-col justify-between font-sans text-slate-900 select-none">
      {/* 1. CABEÇALHO BRANCO RESPONSIVO (Fixado sem estourar altura) */}
      <header className="bg-white text-slate-800 px-3 sm:px-8 lg:px-10 py-2 sm:py-2.5 shadow-2xs flex items-center justify-between border-b border-slate-200 gap-2 shrink-0">
        {/* Identificação da Cozinha com Logo IFPE e nome Cozinha */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="relative w-28 sm:w-36 lg:w-44 h-8 sm:h-10 flex items-center">
            <Image
              src="/ifpe_bjpng.png"
              alt="IFPE Campus Belo Jardim"
              fill
              sizes="176px"
              className="object-contain object-left"
              priority
              unoptimized
            />
          </div>
          <div className="border-l border-slate-300 pl-2 sm:pl-3">
            <h1 className="text-xs sm:text-sm lg:text-base font-black tracking-wider uppercase text-slate-800">
              COZINHA
            </h1>
          </div>
        </div>

        {/* Relógio e Data Compactos e Responsivos + Botão de Tela Cheia */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 text-xs sm:text-sm font-semibold">
            <span className="font-mono font-bold text-slate-900 text-xs sm:text-base">
              {horaFormatada}
            </span>
            <span className="text-slate-300">•</span>
            <span className="capitalize hidden sm:inline">{dataAtualFormatada}</span>
            <span className="capitalize sm:hidden text-[11px]">{dataCurta}</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={telaCheia ? "Sair da Tela Cheia" : "Tela Cheia (F11)"}
          >
            {telaCheia ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. ÁREA CENTRAL: O CARDÁPIO AJUSTADO PARA CABER 100% DA TELA SEM SCROLL */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-2.5 sm:p-4 lg:p-6 w-full overflow-hidden">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1500px] h-full max-h-full bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col justify-between overflow-hidden">
          
          {/* Topo do Cardápio: Título, Horário e Quantidade de Pessoas */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-slate-200 gap-2 sm:gap-4 shrink-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-black text-slate-900 tracking-tight">
              {infoAtual.titulo}
            </h2>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-slate-800">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base font-black">{horarioRefeicao}</span>
              </div>

              {quantidadePessoas && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-emerald-900">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-base font-black">{quantidadePessoas} pessoas</span>
                </div>
              )}
            </div>
          </div>

          {/* Corpo: Exibição fluida que respeita a altura da tela */}
          <div className="py-2 sm:py-4 flex-1 min-h-0 flex flex-col justify-center overflow-y-auto scrollbar-none">
            {linhasTexto.length > 0 ? (
              <div className="p-3.5 sm:p-5 lg:p-7 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2 sm:space-y-3 text-left">
                {linhasTexto.map((linha, idx) => {
                  const ehItemComTraco = linha.startsWith("-");

                  if (ehItemComTraco) {
                    const limpo = linha.replace(/^-\s*/, "");
                    const matchQtd = limpo.match(/\(([^)]+)\)/);
                    const nome = limpo.replace(/\([^)]+\)/, "").trim();
                    const qtd = matchQtd ? matchQtd[1].trim() : "";

                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 sm:gap-3 pl-1 leading-snug"
                      >
                        <div className="flex items-baseline gap-1.5 sm:gap-2.5 min-w-0">
                          <span className="font-extrabold text-slate-900 text-base sm:text-xl lg:text-2xl shrink-0">
                            -
                          </span>
                          <span className="font-bold text-slate-950 text-base sm:text-xl lg:text-2xl 2xl:text-3xl break-words">
                            {nome}
                          </span>
                        </div>
                        {qtd && (
                          <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-lg border border-emerald-300 text-xs sm:text-sm lg:text-lg shrink-0 whitespace-nowrap self-start sm:self-auto ml-4 sm:ml-0">
                            ({qtd})
                          </span>
                        )}
                      </div>
                    );
                  }

                  const ehSalada = linha.toLowerCase().startsWith("salada");

                  return (
                    <p
                      key={idx}
                      className={`pl-1 leading-snug text-base sm:text-xl lg:text-2xl 2xl:text-3xl ${
                        ehSalada
                          ? "font-extrabold text-emerald-900 bg-emerald-100/70 p-2.5 sm:p-3 rounded-xl border border-emerald-300"
                          : "font-bold text-slate-900"
                      }`}
                    >
                      {linha}
                    </p>
                  );
                })}

                {observacoes && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-start gap-2 sm:gap-3">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md shrink-0">
                      OBSERVAÇÃO
                    </span>
                    <p className="text-xs sm:text-sm lg:text-base font-bold text-amber-950">
                      {observacoes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-w-xl mx-auto text-center py-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                  <Utensils className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-800 uppercase tracking-wide">
                  CARDÁPIO EM ELABORAÇÃO
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Nenhum item cadastrado para o {infoAtual.titulo.toLowerCase()} desta {diaSemana.toLowerCase()}.
                </p>
              </div>
            )}
          </div>

          {/* Rodapé Interno do Card: Somente sincronizando automaticamente */}
          <div className="pt-2 sm:pt-3 border-t border-slate-200 flex items-center justify-end shrink-0">
            <span className="text-[10px] sm:text-xs text-slate-400">
              Sincronizando automaticamente
            </span>
          </div>

        </div>
      </main>

      {/* 3. RODAPÉ INSTITUCIONAL (Fixado sem gerar scroll) */}
      <footer className="bg-white text-slate-600 px-4 sm:px-8 lg:px-10 py-1.5 sm:py-2 border-t border-slate-200 text-center text-[10px] sm:text-xs font-medium shrink-0">
        <p className="leading-tight">
          Instituto Federal de Educação, Ciência e Tecnologia de Pernambuco - <span className="italic">Campus</span> Belo Jardim
        </p>
      </footer>
    </div>
  );
}
