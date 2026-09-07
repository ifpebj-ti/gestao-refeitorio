"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  PackageX,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import {
  obterEstoqueMinimoPorCategoria,
  CategoriaAlimento,
} from "@/app/utils/estoqueRules";

interface AlertaValidade {
  id: string;
  insumo: string;
  categoria: CategoriaAlimento;
  quantidade: number;
  unidade: string;
  dataValidade: string;
  diasRestantes: number;
  lote?: string;
  fornecedor: string;
}

interface AlertaEstoqueMinimo {
  id: string;
  insumo: string;
  categoria: CategoriaAlimento;
  saldoAtual: number;
  unidade: string;
}

const ALERTAS_VALIDADE: AlertaValidade[] = [
  {
    id: "v1",
    insumo: "Peito de Frango",
    categoria: "Proteínas & Frios",
    quantidade: 15,
    unidade: "Kg",
    dataValidade: "08/09/2026",
    diasRestantes: 2,
    lote: "LT-902",
    fornecedor: "Avícola Regional",
  },
  {
    id: "v2",
    insumo: "Leite in natura",
    categoria: "Laticínios",
    quantidade: 20,
    unidade: "Lt",
    dataValidade: "09/09/2026",
    diasRestantes: 3,
    fornecedor: "Cooperativa Vale do Ipojuca",
  },
  {
    id: "v3",
    insumo: "Tomate",
    categoria: "Hortifrúti",
    quantidade: 12,
    unidade: "Kg",
    dataValidade: "10/09/2026",
    diasRestantes: 4,
    fornecedor: "Feirante Local",
  },
];

const ALERTAS_ESTOQUE: AlertaEstoqueMinimo[] = [
  {
    id: "e1",
    insumo: "Óleo Vegetal",
    categoria: "Especificações & Condimentos",
    saldoAtual: 4,
    unidade: "Lt",
  },
  {
    id: "e2",
    insumo: "Arroz Parboilizado",
    categoria: "Grãos & Cereais",
    saldoAtual: 20,
    unidade: "Kg",
  },
  {
    id: "e3",
    insumo: "Alho in natura",
    categoria: "Hortifrúti",
    saldoAtual: 1.5,
    unidade: "Kg",
  },
];

export default function CentralAlertasPage() {
  const { perfil } = useAuth();
  const isNutri = perfil === "NUTRICIONISTA";

  const [abaAtiva, setAbaAtiva] = useState<"validade" | "estoque">("validade");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Central de Alertas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consulte produtos que devem ser gastos primeiro e itens que atingiram o limite seguro de estoque.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={isNutri ? "/cardapio" : "/consumo"}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <span>{isNutri ? "Ver Cardápio Semanal" : "Ir para Consumo Diário"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. CARDS DE SELEÇÃO RÁPIDA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setAbaAtiva("validade")}
          className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs ${
            abaAtiva === "validade"
              ? "bg-amber-50/70 border-amber-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-amber-900">
              {ALERTAS_VALIDADE.length}
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 mt-3">
            Usar Primeiro (Vencendo)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Alimentos com prazo curto que devem ter prioridade no preparo.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("estoque")}
          className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs ${
            abaAtiva === "estoque"
              ? "bg-rose-50/70 border-rose-400"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <PackageX className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-rose-900">
              {ALERTAS_ESTOQUE.length}
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 mt-3">
            Estoque Acabando (Atenção)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Itens que atingiram a margem segura de segurança e precisam de reposição.
          </p>
        </button>
      </div>

      {/* 3. LISTAGEM */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>
              {abaAtiva === "validade"
                ? "Produtos Próximos ao Vencimento"
                : "Produtos com Quantidade Abaixo do Mínimo Seguro"}
            </span>
          </h3>

          <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
            {abaAtiva === "validade"
              ? `${ALERTAS_VALIDADE.length} itens`
              : `${ALERTAS_ESTOQUE.length} itens`}
          </span>
        </div>

        {/* LISTA 1: VALIDADE */}
        {abaAtiva === "validade" && (
          <div className="divide-y divide-slate-100">
            {ALERTAS_VALIDADE.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {item.insumo}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {item.categoria}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Disponível no estoque:{" "}
                    <strong className="text-slate-800">
                      {item.quantidade} {item.unidade}
                    </strong>{" "}
                    • Fornecedor: {item.fornecedor}
                    {item.lote && ` • Lote: ${item.lote}`}
                  </p>
                </div>

                {/* Selo Visual de Prazo */}
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-300/80 px-3.5 py-1.5 rounded-xl text-amber-950 self-start sm:self-auto shrink-0">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="text-left sm:text-right">
                    <p className="text-xs sm:text-sm font-black leading-tight">
                      Vence em {item.diasRestantes} dias
                    </p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Data: {item.dataValidade}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LISTA 2: ESTOQUE BAIXO (CALCULADO VIA CATEGORIA) */}
        {abaAtiva === "estoque" && (
          <div className="divide-y divide-slate-100">
            {ALERTAS_ESTOQUE.map((item) => {
              const minimoCategoria = obterEstoqueMinimoPorCategoria(item.categoria);
              const porcentagem = Math.min(
                100,
                Math.round((item.saldoAtual / minimoCategoria) * 100)
              );

              return (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 max-w-md">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {item.insumo}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.categoria}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Resta apenas:{" "}
                      <strong className="text-rose-700 text-sm">
                        {item.saldoAtual} {item.unidade}
                      </strong>{" "}
                      (mínimo seguro para categoria: {minimoCategoria} {item.unidade})
                    </p>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                  </div>

                  <div className="self-start sm:self-auto shrink-0">
                    {isNutri ? (
                      <Link
                        href="/estoque"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                      >
                        <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Auditar Estoque</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Pedir Reposição</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Caixa Informativa */}
      <div className="bg-slate-100/70 border border-slate-200 p-4 rounded-2xl text-xs text-slate-600 flex items-start gap-3">
        <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Dica para a equipe:</strong> Ao iniciar o turno, verifique esta lista para priorizar os insumos de prazo curto no cardápio do dia e acompanhar o estoque de segurança.
        </p>
      </div>
    </div>
  );
}