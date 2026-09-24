"use client";

import { useState, useRef, useEffect } from "react";
import { Coffee, SunMedium, Moon, ChevronDown, Check } from "lucide-react";

export type TipoRefeicao = "Café da Manhã" | "Almoço" | "Jantar";

interface SeletorRefeicaoProps {
  valor: TipoRefeicao;
  onChange: (refeicao: TipoRefeicao) => void;
}

const OPCOES: { tipo: TipoRefeicao; label: string; icon: typeof Coffee; horario: string }[] = [
  { tipo: "Café da Manhã", label: "Café da Manhã", icon: Coffee, horario: "07:00 - 08:30" },
  { tipo: "Almoço", label: "Almoço", icon: SunMedium, horario: "11:30 - 13:30" },
  { tipo: "Jantar", label: "Jantar", icon: Moon, horario: "17:30 - 19:00" },
];

export default function SeletorRefeicao({ valor, onChange }: SeletorRefeicaoProps) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const opcaoAtual = OPCOES.find((op) => op.tipo === valor) || OPCOES[1];
  const IconAtual = opcaoAtual.icon;

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão Gatilho */}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-white border border-slate-300 hover:border-emerald-500 rounded-xl shadow-xs transition-all duration-150 focus:outline-none cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <IconAtual className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-none">{opcaoAtual.label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">{opcaoAtual.horario}</p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${
            aberto ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Menu Suspenso */}
      {aberto && (
        <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {OPCOES.map((op) => {
            const Icon = op.icon;
            const selecionado = op.tipo === valor;

            return (
              <button
                key={op.tipo}
                type="button"
                onClick={() => {
                  onChange(op.tipo);
                  setAberto(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  selecionado
                    ? "bg-emerald-50 text-emerald-900 font-bold"
                    : "hover:bg-slate-50 text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      selecionado ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm leading-none">{op.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-normal">{op.horario}</p>
                  </div>
                </div>
                {selecionado && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}