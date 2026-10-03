"use client";

import { useEffect, useState, useMemo } from "react";
import { Utensils } from "lucide-react";

export interface ItemLinhaCardapio {
  id: string;
  nome: string;
  quantidade?: string;
}

export interface DadosRefeicaoCardapio {
  texto?: string;
  itens?: ItemLinhaCardapio[];
  itensSalada?: ItemLinhaCardapio[];
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
  modoFixo?: boolean;
}

interface ItemCardapioNormalizado {
  nome: string;
  quantidade?: string;
}

export default function CardapioCard({
  refeicao,
  descricao,
  responsavel,
  dadosRefeicao,
  modoFixo = false,
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

  const temTextoLivre = Boolean(dadosRefeicao?.texto && dadosRefeicao.texto.trim());
  const temArrayItens = Boolean(dadosRefeicao && Array.isArray(dadosRefeicao.itens));
  const temItensLinha = Boolean(
    temArrayItens &&
      ((dadosRefeicao?.itens?.length || 0) > 0 || (dadosRefeicao?.itensSalada?.length || 0) > 0)
  );

  const temDadosLegados = Boolean(
    !temTextoLivre &&
      !temArrayItens &&
      dadosRefeicao &&
      (dadosRefeicao.pratoPrincipal ||
        dadosRefeicao.acompanhamentos ||
        dadosRefeicao.saladaSobremesa ||
        dadosRefeicao.bebida ||
        (dadosRefeicao.insumosPlanejados && dadosRefeicao.insumosPlanejados.length > 0))
  );

  const ehPadrao =
    !temTextoLivre &&
    !temItensLinha &&
    !temDadosLegados &&
    (!descricao || descricao.startsWith("Nenhum cardápio cadastrado"));

  // Normaliza todos os itens de qualquer formato em uma lista limpa e unificada
  const itensNormalizados = useMemo<ItemCardapioNormalizado[]>(() => {
    if (ehPadrao) return [];
    const lista: ItemCardapioNormalizado[] = [];

    // 1. Texto livre: linhas com - Nome (Qtd)
    if (temTextoLivre) {
      const linhas = (dadosRefeicao?.texto || "").split("\n").map((l) => l.trim()).filter(Boolean);
      for (const linha of linhas) {
        const limpo = linha.replace(/^[-•*]\s*/, "").trim();
        if (!limpo) continue;
        const matchQtd = limpo.match(/\(([^)]+)\)/);
        const nome = limpo.replace(/\([^)]+\)/, "").trim();
        const qtd = matchQtd ? matchQtd[1].trim() : undefined;
        lista.push({ nome, quantidade: qtd });
      }
      return lista;
    }

    // 2. Itens estruturados (pratos e saladas)
    if (temItensLinha) {
      if (dadosRefeicao?.itens) {
        for (const it of dadosRefeicao.itens) {
          if (!it.nome?.trim()) continue;
          lista.push({ nome: it.nome.trim(), quantidade: it.quantidade?.trim() || undefined });
        }
      }
      if (dadosRefeicao?.itensSalada) {
        for (const it of dadosRefeicao.itensSalada) {
          if (!it.nome?.trim()) continue;
          const nomeSal = it.nome.toLowerCase().startsWith("salada") ? it.nome.trim() : `Salada: ${it.nome.trim()}`;
          lista.push({ nome: nomeSal, quantidade: it.quantidade?.trim() || undefined });
        }
      }
      return lista;
    }

    // 3. Fallback legado
    if (temDadosLegados && dadosRefeicao) {
      if (dadosRefeicao.pratoPrincipal) lista.push({ nome: dadosRefeicao.pratoPrincipal });
      if (dadosRefeicao.acompanhamentos) lista.push({ nome: dadosRefeicao.acompanhamentos });
      if (dadosRefeicao.saladaSobremesa) lista.push({ nome: `Salada: ${dadosRefeicao.saladaSobremesa}` });
      if (dadosRefeicao.bebida) lista.push({ nome: `Bebida: ${dadosRefeicao.bebida}` });
      return lista;
    }

    // 4. Fallback por descrição com separador •
    if (descricao && !ehPadrao) {
      const partes = descricao.split(" • ").map((s) => s.trim()).filter(Boolean);
      for (const p of partes) {
        const matchQtd = p.match(/\(([^)]+)\)/);
        const nome = p.replace(/\([^)]+\)/, "").trim();
        const qtd = matchQtd ? matchQtd[1].trim() : undefined;
        lista.push({ nome, quantidade: qtd });
      }
    }

    return lista;
  }, [dadosRefeicao, temTextoLivre, temItensLinha, temDadosLegados, ehPadrao, descricao]);

  const obsTexto = dadosRefeicao?.observacoes?.trim() || "";

  // ==============================================================
  // 1. MODO ENXUTO E COMPACTO (Exclusivamente os chips organizados)
  // ==============================================================
  if (modoFixo) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2 sm:px-3 sm:py-2 shadow-2xs transition-all overflow-hidden">
        {ehPadrao ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shrink-0">
              <Utensils className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
              <span>{refeicao}</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-500 italic">
              Nenhum cardápio cadastrado para esta refeição.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 py-0.5">
            {/* Tag da Refeição em destaque legível */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shrink-0 shadow-2xs">
              <Utensils className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
              <span>{refeicao}</span>
            </span>

            {/* Chips de cada prato: expandidos sem cortes, alto contraste e tamanho compacto */}
            {itensNormalizados.map((it, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold text-slate-900 shadow-2xs transition-colors"
              >
                <span className="text-emerald-600 font-black">•</span>
                <span>{it.nome}</span>
                {it.quantidade && (
                  <span className="text-slate-800 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                    {it.quantidade}
                  </span>
                )}
              </span>
            ))}

            {/* Obs se houver */}
            {obsTexto && (
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-xl text-xs sm:text-sm font-medium text-amber-950 shadow-2xs">
                <span className="font-extrabold text-amber-900 bg-amber-200/70 px-1.5 py-0.2 rounded text-[11px] uppercase">
                  Obs
                </span>
                <span>{obsTexto}</span>
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==============================================================
  // 2. MODO PADRÃO (Para Outras Páginas se Necessário)
  // ==============================================================
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm tracking-wider uppercase">
          <Utensils className="w-4 h-4 text-emerald-700" />
          <span>Cardápio do Dia • {refeicao}</span>
        </div>
        <span className="text-xs font-bold text-slate-500">{nomeResponsavel}</span>
      </div>

      {ehPadrao ? (
        <p className="text-xs text-slate-400 italic pt-3">
          Nenhum cardápio cadastrado para esta refeição.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5 pt-3">
          {itensNormalizados.map((it, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <span>{it.nome}</span>
              {it.quantidade && (
                <span className="text-emerald-700 font-extrabold text-[11px]">
                  ({it.quantidade})
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}