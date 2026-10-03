"use client";

import { useEffect, useState } from "react";

export interface ItemLinhaCardapio {
  id: string;
  nome: string;
  quantidade?: string;
}

export interface DadosRefeicaoCardapio {
  itens?: ItemLinhaCardapio[];
  observacoes?: string;
  quantidadePessoas?: string;
  // Campos legados para retrocompatibilidade:
  pratoPrincipal?: string;
  acompanhamentos?: string;
  saladaSobremesa?: string;
  bebida?: string;
  insumosPlanejados?: { nome: string; quantidadeTotal: number; unidadeMedida: string }[];
}

interface CardapioCardProps {
  refeicao: string;
  descricao: string;
  responsavel?: string;
  dadosRefeicao?: DadosRefeicaoCardapio | null;
}

export default function CardapioCard({
  refeicao,
  descricao,
  responsavel,
  dadosRefeicao,
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

  const temArrayItens = Boolean(dadosRefeicao && Array.isArray(dadosRefeicao.itens));
  const temItensLinha = Boolean(temArrayItens && (dadosRefeicao?.itens?.length || 0) > 0);

  // Dados legados só são considerados se NÃO existir a lista oficial de itens
  const temDadosLegados = Boolean(
    !temArrayItens &&
      dadosRefeicao &&
      (dadosRefeicao.pratoPrincipal ||
        dadosRefeicao.acompanhamentos ||
        dadosRefeicao.saladaSobremesa ||
        dadosRefeicao.bebida ||
        (dadosRefeicao.insumosPlanejados && dadosRefeicao.insumosPlanejados.length > 0))
  );

  const ehPadrao =
    !temItensLinha &&
    !temDadosLegados &&
    (!descricao || descricao.startsWith("Nenhum cardápio cadastrado"));

  // Separa salada dos outros itens se tiver itens em linha
  const itens = dadosRefeicao?.itens || [];
  const itemSalada = itens.find((it) => it.nome.toLowerCase().startsWith("salada"));
  const itensSemSalada = itens.filter((it) => !it.nome.toLowerCase().startsWith("salada"));

  // Parser de fallback se apenas a string descricao estiver preenchida (ex: partes separadas por •)
  const itensFallback = (!dadosRefeicao && !ehPadrao && descricao)
    ? descricao.split(" • ").map((s) => s.trim()).filter(Boolean)
    : [];

  const saladaFallback = itensFallback.find((it) => it.toLowerCase().startsWith("salada"));
  const outrosItensFallback = itensFallback.filter((it) => !it.toLowerCase().startsWith("salada"));

  return (
    <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Topo do Card */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-emerald-100/80">
        <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm tracking-wider uppercase">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cardápio do Dia • {refeicao}</span>
        </div>

        <div className="flex flex-col items-end text-right shrink-0">
          <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider font-bold">
            Planejamento Semanal
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-950 mt-0.5">
            {nomeResponsavel}
          </span>
        </div>
      </div>

      {ehPadrao ? (
        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
          <p className="text-xs sm:text-sm text-slate-500 italic">
            Nenhum cardápio cadastrado para esta refeição. O nutricionista pode definir no planejamento semanal.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Seção da Salada (se houver) */}
          {(itemSalada || (temDadosLegados && dadosRefeicao?.saladaSobremesa) || saladaFallback) && (
            <div className="space-y-1 pl-1">
              <p className="font-bold text-slate-900 text-xs sm:text-sm">Salada:</p>
              <p className="text-slate-800 text-xs sm:text-sm font-medium">
                {itemSalada
                  ? itemSalada.nome.replace(/^salada:\s*/i, "")
                  : dadosRefeicao?.saladaSobremesa || saladaFallback?.replace(/^salada(\/sobremesa)?:\s*/i, "")}
                {itemSalada?.quantidade ? ` (${itemSalada.quantidade})` : ""}
              </p>
            </div>
          )}

          {/* Lista de Itens no formato do papel (- Item (Qtd)) */}
          <div className="space-y-1.5 pl-1 text-xs sm:text-sm text-slate-900">
            {temItensLinha ? (
              <>
                {itensSemSalada.map((it) => (
                  <p key={it.id} className="flex items-start gap-2">
                    <span className="font-extrabold text-slate-900">-</span>
                    <span className="font-bold text-slate-950">{it.nome}</span>
                    {it.quantidade && (
                      <span className="font-medium text-emerald-900">
                        ({it.quantidade})
                      </span>
                    )}
                  </p>
                ))}

                {dadosRefeicao?.observacoes && (
                  <p className="flex items-start gap-2 text-slate-700 italic pt-1">
                    <span className="font-extrabold not-italic text-slate-900">-</span>
                    <span>Obs: {dadosRefeicao.observacoes}</span>
                  </p>
                )}
              </>
            ) : temDadosLegados ? (
              <>
                {dadosRefeicao?.pratoPrincipal && (
                  <p className="flex items-start gap-2">
                    <span className="font-extrabold text-slate-900">-</span>
                    <span className="font-bold text-slate-950">{dadosRefeicao.pratoPrincipal}</span>
                  </p>
                )}

                {dadosRefeicao?.acompanhamentos && (
                  <p className="flex items-start gap-2">
                    <span className="font-extrabold text-slate-900">-</span>
                    <span>{dadosRefeicao.acompanhamentos}</span>
                  </p>
                )}

                {dadosRefeicao?.insumosPlanejados &&
                  dadosRefeicao.insumosPlanejados.map((ins, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="font-extrabold text-slate-900">-</span>
                      <span>
                        {ins.nome} ({ins.quantidadeTotal} {ins.unidadeMedida})
                      </span>
                    </p>
                  ))}

                {dadosRefeicao?.bebida && (
                  <p className="flex items-start gap-2">
                    <span className="font-extrabold text-slate-900">-</span>
                    <span className="font-semibold text-emerald-950">{dadosRefeicao.bebida}</span>
                  </p>
                )}

                {dadosRefeicao?.observacoes && (
                  <p className="flex items-start gap-2 text-slate-700 italic">
                    <span className="font-extrabold not-italic text-slate-900">-</span>
                    <span>Obs: {dadosRefeicao.observacoes}</span>
                  </p>
                )}
              </>
            ) : (
              outrosItensFallback.map((item, idx) => (
                <p key={idx} className="flex items-start gap-2">
                  <span className="font-extrabold text-slate-900">-</span>
                  <span>{item}</span>
                </p>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}