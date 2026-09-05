"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Utensils, CalendarDays, Boxes, PackagePlus } from "lucide-react";
import { PerfilUsuario } from "../context/AuthContext";

interface AcoesAlertaProps {
  perfil: PerfilUsuario;
  tipoAlerta: "VALIDADE" | "ESTOQUE_BAIXO" | "ENTREGA";
  resolvido: boolean;
  onAlternarResolvido: () => void;
}

export default function AcoesAlerta({
  perfil,
  tipoAlerta,
  resolvido,
  onAlternarResolvido,
}: AcoesAlertaProps) {
  const isNutri = perfil === "NUTRICIONISTA";

  return (
    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
      {!resolvido && (
        <>
          {/* AÇÕES DA COZINHA (Operacionais) */}
          {!isNutri && (
            <>
              {tipoAlerta === "VALIDADE" && (
                <Link
                  href="/consumo"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Usar no Consumo</span>
                </Link>
              )}

              {tipoAlerta === "ENTREGA" && (
                <Link
                  href="/recebimento"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Conferir Entrega</span>
                </Link>
              )}
            </>
          )}

          {/* AÇÕES DO NUTRICIONISTA (Gestão Técnica) */}
          {isNutri && (
            <>
              {tipoAlerta === "VALIDADE" && (
                <Link
                  href="/cardapio"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ajustar Cardápio</span>
                </Link>
              )}

              {tipoAlerta === "ESTOQUE_BAIXO" && (
                <Link
                  href="/estoque"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auditar Estoque</span>
                </Link>
              )}
            </>
          )}
        </>
      )}

      {/* BOTÃO COMUM: CIENTE / CONCLUÍDO */}
      <button
        type="button"
        onClick={onAlternarResolvido}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
          resolvido
            ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
            : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
        }`}
        title={resolvido ? "Reabrir alerta" : "Marcar como ciente"}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{resolvido ? "Concluído" : "Dar Ciência"}</span>
      </button>
    </div>
  );
}