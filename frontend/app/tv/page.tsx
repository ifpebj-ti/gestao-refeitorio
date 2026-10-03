"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Utensils, Maximize2, Minimize2 } from "lucide-react";

type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
type TipoRefeicaoChave = "cafe" | "almoco" | "jantar";

const STORAGE_KEY = "@gestao_refeitorio:cardapio_semanal";
const KEY_REFEICAO_TV = "@gestao_refeitorio:refeicao_ativa_tv";

const DIAS_NOMES: Record<number, DiaSemana> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
};

export default function TvMuralPage() {
  const [dataAtualFormatada, setDataAtualFormatada] = useState<string>("");
  const [diaSemana, setDiaSemana] = useState<DiaSemana>("Segunda");
  const [telaCheia, setTelaCheia] = useState(false);
  const [textoCardapio, setTextoCardapio] = useState<string>("");

  // Relógio e detecção do dia da semana
  useEffect(() => {
    const atualizarData = () => {
      const agora = new Date();
      setDataAtualFormatada(
        agora.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );

      const diaNum = agora.getDay();
      const diaDetectado = DIAS_NOMES[diaNum] || "Segunda";
      setDiaSemana(diaDetectado);
    };

    atualizarData();
    const timer = setInterval(atualizarData, 60000);
    return () => clearInterval(timer);
  }, []);

  // Leitura do cardápio com auto-atualização contínua
  const carregarCardapio = () => {
    try {
      // Lê qual refeição o Nutricionista definiu para ser transmitida na TV
      const refeicaoSalva = localStorage.getItem(KEY_REFEICAO_TV);
      if (refeicaoSalva === "nenhuma") {
        setTextoCardapio("");
        return;
      }

      const refeicaoAtiva: TipoRefeicaoChave =
        refeicaoSalva && ["cafe", "almoco", "jantar"].includes(refeicaoSalva)
          ? (refeicaoSalva as TipoRefeicaoChave)
          : "almoco";

      // 1. Prioridade direta: texto digitado manualmente pelo usuário na tela Cardápio na TV
      const textoTvManual = localStorage.getItem(`@gestao_refeitorio:texto_tv_${refeicaoAtiva}`);
      if (textoTvManual && textoTvManual.trim()) {
        const formatado = textoTvManual
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => l.replace(/^-\s*/, ""))
          .join(" • ");
        setTextoCardapio(formatado);
        return;
      }

      // 2. Fallback: cardápio semanal
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        const dadosDia = parsed[diaSemana];
        if (dadosDia && dadosDia[refeicaoAtiva]) {
          const ref = dadosDia[refeicaoAtiva];
          if (ref.texto && typeof ref.texto === "string" && ref.texto.trim()) {
            const formatado = ref.texto
              .split("\n")
              .map((l: string) => l.trim())
              .filter(Boolean)
              .map((l: string) => l.replace(/^-\s*/, ""))
              .join(" • ");
            setTextoCardapio(formatado);
            return;
          }

          let partes: string[] = [];

          const temItens = Boolean(ref.itens && Array.isArray(ref.itens) && ref.itens.length > 0);
          const temItensSalada = Boolean(ref.itensSalada && Array.isArray(ref.itensSalada) && ref.itensSalada.length > 0);

          if (temItens || temItensSalada) {
            if (temItens) {
              partes.push(...ref.itens.map((it: any) => it.nome?.trim()).filter(Boolean));
            }
            if (temItensSalada) {
              const saladas = ref.itensSalada.map((it: any) => it.nome?.trim()).filter(Boolean);
              if (saladas.length > 0) {
                partes.push(`SALADA: ${saladas.join(" + ")}`);
              }
            }
            if (ref.observacoes?.trim()) {
              partes.push(`OBS: ${ref.observacoes.trim()}`);
            }
          } else {
            partes = [
              ref.pratoPrincipal,
              ref.acompanhamentos ? `ACOMPANHAMENTOS: ${ref.acompanhamentos}` : "",
              ref.saladaSobremesa ? `SALADA: ${ref.saladaSobremesa}` : "",
              ref.bebida ? `BEBIDA: ${ref.bebida}` : "",
              ref.observacoes ? `OBS: ${ref.observacoes}` : "",
            ].filter(Boolean);
          }

          const texto = partes.join(" • ");
          setTextoCardapio(texto.trim());
          return;
        }
      }
    } catch (e) {
      console.error("Erro ao ler cardápio para TV:", e);
    }
    setTextoCardapio("");
  };

  useEffect(() => {
    carregarCardapio();
    // Atualiza periodicamente para refletir mudanças do nutricionista instantaneamente
    const interval = setInterval(carregarCardapio, 10000);
    window.addEventListener("storage", carregarCardapio);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", carregarCardapio);
    };
  }, [diaSemana]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setTelaCheia(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setTelaCheia(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-900 select-none">
      {/* 1. CABEÇALHO INSTITUCIONAL IFPE (Verde Padrão do Sistema) */}
      <header className="bg-emerald-600 text-white px-6 sm:px-12 py-3.5 shadow-md flex items-center justify-between border-b-4 border-emerald-700">
        {/* Identificação Institucional */}
        <div className="flex items-center gap-4">
          <div className="relative w-36 sm:w-44 h-12 bg-white px-2 py-1 rounded-lg shadow-xs flex items-center justify-center">
            <Image
              src="/ifpe_bjpng.png"
              alt="IFPE Campus Belo Jardim"
              fill
              sizes="176px"
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="hidden sm:block leading-tight">
            <h1 className="text-base sm:text-lg font-black tracking-wider uppercase">
              Instituto Federal de Pernambuco
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-100">
              Campus Belo Jardim • Refeitório Universitário
            </p>
          </div>
        </div>

        {/* Somente a Data e Botão de Tela Cheia */}
        <div className="flex items-center gap-4 sm:gap-6">
          <p className="text-xs sm:text-base font-bold text-emerald-100 uppercase tracking-wide">
            {dataAtualFormatada}
          </p>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title={telaCheia ? "Sair da Tela Cheia" : "Tela Cheia (F11)"}
          >
            {telaCheia ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. ÁREA CENTRAL: SOMENTE O CARDÁPIO EM LETRAS GIGANTES DE ALTO CONTRASTE */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-7xl bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-14 lg:p-16 shadow-lg min-h-[55vh] flex flex-col justify-center items-center text-center">
          {textoCardapio ? (
            <p
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              className="font-normal text-slate-900 leading-relaxed text-2xl sm:text-3xl md:text-4xl lg:text-5xl uppercase break-words"
            >
              {textoCardapio}
            </p>
          ) : (
            <div className="space-y-4 max-w-xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <Utensils className="w-8 h-8" />
              </div>
              <h2
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                className="text-2xl sm:text-3xl font-bold text-slate-800 uppercase tracking-wide"
              >
                CARDÁPIO EM ELABORAÇÃO
              </h2>
              <p
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                className="text-base sm:text-lg text-slate-500"
              >
                A equipe de nutrição está finalizando a preparação do cardápio para exibição.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 3. RODAPÉ INSTITUCIONAL IFPE (Verde Padrão do Sistema) */}
      <footer className="bg-emerald-600 text-white px-6 sm:px-12 py-3 border-t-4 border-emerald-700 text-center text-xs sm:text-sm font-semibold tracking-wide">
        <p>
          Instituto Federal de Pernambuco - Campus Belo Jardim • Av. Sebastião Rodrigues da Costa, s/n - Belo Jardim - CEP 55155-700
        </p>
        <p className="text-emerald-100 text-[11px] sm:text-xs mt-0.5">
          Fone: (81) 3411-3200 • Sistema de Gestão do Refeitório
        </p>
      </footer>
    </div>
  );
}
