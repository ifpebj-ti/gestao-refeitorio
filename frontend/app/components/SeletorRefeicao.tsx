"use client";

import { Coffee, SunMedium, Moon } from "lucide-react";

export type TipoRefeicao = "Café da Manhã" | "Almoço" | "Jantar";

export function obterRefeicaoPorHorario(): TipoRefeicao {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 11) {
    return "Café da Manhã";
  }
  if (hora >= 11 && hora < 16) {
    return "Almoço";
  }
  return "Jantar";
}

interface SeletorRefeicaoProps {
  valor: TipoRefeicao;
  onChange: (refeicao: TipoRefeicao) => void;
}

const OPCOES: { tipo: TipoRefeicao; label: string; icon: typeof Coffee }[] = [
  { tipo: "Café da Manhã", label: "Café", icon: Coffee },
  { tipo: "Almoço", label: "Almoço", icon: SunMedium },
  { tipo: "Jantar", label: "Jantar", icon: Moon },
];

export default function SeletorRefeicao({ valor, onChange }: SeletorRefeicaoProps) {
  return (
    <div className="inline-flex items-center p-0.5 sm:p-1 bg-white border border-slate-300 rounded-xl shadow-2xs gap-0.5 sm:gap-1">
      {OPCOES.map((op) => {
        const Icon = op.icon;
        const selecionado = op.tipo === valor;

        return (
          <button
            key={op.tipo}
            type="button"
            onClick={() => onChange(op.tipo)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              selecionado
                ? "bg-emerald-600 text-white shadow-xs scale-102"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${selecionado ? "text-white" : "text-slate-500"}`} />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}