"use client";

import { useEffect, useState } from "react";

interface CardapioCardProps {
  refeicao: string;
  descricao: string;
  responsavel?: string;
}

export default function CardapioCard({
  refeicao,
  descricao,
  responsavel,
}: CardapioCardProps) {
  const [nomeResponsavel, setNomeResponsavel] = useState(responsavel || "Nutricionista");

  useEffect(() => {
    if (responsavel) {
      setNomeResponsavel(responsavel);
      return;
    }
    try {
      const salvo = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:cardapio_nutricionista") : null;
      if (salvo && salvo.trim()) {
        setNomeResponsavel(salvo);
      } else {
        setNomeResponsavel("Nutricionista");
      }
    } catch {
      setNomeResponsavel("Nutricionista");
    }
  }, [responsavel]);

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border-2 border-emerald-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 max-w-4xl">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm tracking-wide uppercase">
            <span>Cardápio do Dia • {refeicao}</span>
          </div>

          {/* Texto corrido natural igual ao mural/TV */}
          <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
            {descricao}
          </p>
        </div>

        <div className="hidden md:flex flex-col items-end text-right shrink-0">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Planejamento Semanal
          </span>
          <span className="text-xs font-bold text-slate-700 mt-0.5">
            {nomeResponsavel}
          </span>
        </div>
      </div>
    </div>
  );
}