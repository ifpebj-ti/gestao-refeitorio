// "use client";

// import { useState } from "react";
// import {
//   AlertTriangle,
//   Clock,
//   PackageX,
//   CheckCircle2,
//   Calendar,
//   ArrowUpRight,
//   ShieldAlert,
// } from "lucide-react";
// import Link from "next/link";

// interface AlertaValidade {
//   id: string;
//   insumo: string;
//   categoria: string;
//   quantidade: number;
//   unidade: string;
//   dataValidade: string;
//   diasRestantes: number;
//   lote?: string;
//   fornecedor: string;
// }

// interface AlertaEstoqueMinimo {
//   id: string;
//   insumo: string;
//   categoria: string;
//   saldoAtual: number;
//   estoqueMinimo: number;
//   unidade: string;
// }

// const ALERTAS_VALIDADE_MOCK: AlertaValidade[] = [
//   {
//     id: "v1",
//     insumo: "Peito de Frango",
//     categoria: "Proteínas & Frios",
//     quantidade: 15,
//     unidade: "Kg",
//     dataValidade: "2026-09-06",
//     diasRestantes: 2,
//     lote: "LT-902",
//     fornecedor: "Avícola Regional",
//   },
//   {
//     id: "v2",
//     insumo: "Leite in natura",
//     categoria: "Laticínios",
//     quantidade: 20,
//     unidade: "Lt",
//     dataValidade: "2026-09-07",
//     diasRestantes: 3,
//     fornecedor: "Cooperativa Vale do Ipojuca",
//   },
//   {
//     id: "v3",
//     insumo: "Tomate",
//     categoria: "Hortifrúti",
//     quantidade: 12,
//     unidade: "Kg",
//     dataValidade: "2026-09-08",
//     diasRestantes: 4,
//     fornecedor: "Feirante Local",
//   },
// ];

// const ALERTAS_ESTOQUE_MOCK: AlertaEstoqueMinimo[] = [
//   {
//     id: "e1",
//     insumo: "Óleo Vegetal",
//     categoria: "Especificações & Condimentos",
//     saldoAtual: 4,
//     estoqueMinimo: 15,
//     unidade: "Lt",
//   },
//   {
//     id: "e2",
//     insumo: "Arroz Parboilizado",
//     categoria: "Grãos & Cereais",
//     saldoAtual: 20,
//     estoqueMinimo: 50,
//     unidade: "Kg",
//   },
//   {
//     id: "e3",
//     insumo: "Alho in natura",
//     categoria: "Hortifrúti",
//     saldoAtual: 1.5,
//     estoqueMinimo: 5,
//     unidade: "Kg",
//   },
// ];

// export default function CentralAlertasPage() {
//   const [abaAtiva, setAbaAtiva] = useState<"validade" | "estoque">("validade");
//   const [itensValidade, setItensValidade] = useState(ALERTAS_VALIDADE_MOCK);

//   const priorizarItem = (id: string) => {
//     setItensValidade((prev) => prev.filter((item) => item.id !== id));
//   };

//   return (
//     <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full space-y-6 pb-28">
//       {/* 1. TOPO */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
//         <div>
//           <span className="text-[11px] sm:text-xs font-bold tracking-widest text-amber-700 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
//             Monitoramento Preventivo
//           </span>
//           <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
//             Central de Alertas
//           </h1>
//           <p className="text-xs sm:text-sm text-slate-500 mt-1">
//             Controle de produtos com validade próxima e insumos em nível crítico de reposição.
//           </p>
//         </div>

//         <Link
//           href="/consumo"
//           className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto"
//         >
//           <span>Ir para Consumo do Dia</span>
//           <ArrowUpRight className="w-4 h-4" />
//         </Link>
//       </div>

//       {/* 2. CARDS DE RESUMO */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <div
//           onClick={() => setAbaAtiva("validade")}
//           className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
//             abaAtiva === "validade"
//               ? "bg-amber-50/70 border-amber-300 shadow-sm"
//               : "bg-white border-slate-200 hover:border-amber-200"
//           }`}
//         >
//           <div className="flex items-center justify-between">
//             <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
//               <Clock className="w-5 h-5" />
//             </div>
//             <span className="text-2xl font-black text-amber-900">
//               {itensValidade.length}
//             </span>
//           </div>
//           <h3 className="text-base font-extrabold text-slate-900 mt-3">
//             Validade Próxima (Urgente)
//           </h3>
//           <p className="text-xs text-slate-500 mt-0.5">
//             Perecíveis que devem ser consumidos em até 5 dias para evitar desperdício.
//           </p>
//         </div>

//         <div
//           onClick={() => setAbaAtiva("estoque")}
//           className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
//             abaAtiva === "estoque"
//               ? "bg-rose-50/70 border-rose-300 shadow-sm"
//               : "bg-white border-slate-200 hover:border-rose-200"
//           }`}
//         >
//           <div className="flex items-center justify-between">
//             <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
//               <PackageX className="w-5 h-5" />
//             </div>
//             <span className="text-2xl font-black text-rose-900">
//               {ALERTAS_ESTOQUE_MOCK.length}
//             </span>
//           </div>
//           <h3 className="text-base font-extrabold text-slate-900 mt-3">
//             Estoque Crítico
//           </h3>
//           <p className="text-xs text-slate-500 mt-0.5">
//             Insumos com saldo abaixo da margem de segurança estipulada por Hítalo.
//           </p>
//         </div>
//       </div>

//       {/* 3. LISTA DETALHADA POR ABA */}
//       <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
//         {/* Cabeçalho da Lista */}
//         <div className="bg-slate-50/80 px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//           <div className="flex items-center gap-2">
//             <ShieldAlert className="w-5 h-5 text-slate-600" />
//             <h2 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide">
//               {abaAtiva === "validade"
//                 ? "Insumos com Vencimento Iminente"
//                 : "Insumos Necessitando Pedido de Compra"}
//             </h2>
//           </div>

//           <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
//             {abaAtiva === "validade"
//               ? `${itensValidade.length} lotes em observação`
//               : `${ALERTAS_ESTOQUE_MOCK.length} produtos abaixo do mínimo`}
//           </span>
//         </div>

//         {/* Conteúdo: Aba de Validade */}
//         {abaAtiva === "validade" && (
//           <div className="divide-y divide-slate-100">
//             {itensValidade.length === 0 ? (
//               <div className="p-8 text-center text-slate-400 space-y-2">
//                 <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
//                 <p className="text-sm font-bold text-slate-700">Tudo sob controle!</p>
//                 <p className="text-xs">Nenhum lote com validade crítica no momento.</p>
//               </div>
//             ) : (
//               itensValidade.map((item) => (
//                 <div
//                   key={item.id}
//                   className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
//                 >
//                   <div className="space-y-1">
//                     <div className="flex items-center gap-2">
//                       <span className="text-sm sm:text-base font-extrabold text-slate-900">
//                         {item.insumo}
//                       </span>
//                       <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
//                         {item.categoria}
//                       </span>
//                     </div>

//                     <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
//                       <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
//                         Saldo: {item.quantidade} {item.unidade}
//                       </span>
//                       <span>• Fornecedor: {item.fornecedor}</span>
//                       {item.lote && <span>• Lote: {item.lote}</span>}
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
//                     <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900">
//                       <Clock className="w-4 h-4 text-amber-600 shrink-0" />
//                       <div className="text-right sm:text-left">
//                         <p className="text-xs font-black leading-tight">
//                           {item.diasRestantes === 1 ? "Vence amanhã!" : `Vence em ${item.diasRestantes} dias`}
//                         </p>
//                         <p className="text-[10px] text-amber-700">
//                           {new Date(item.dataValidade).toLocaleDateString("pt-BR")}
//                         </p>
//                       </div>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() => priorizarItem(item.id)}
//                       className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
//                       title="Marcar como planejado no cardápio"
//                     >
//                       Priorizado
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}

//         {/* Conteúdo: Aba de Estoque Mínimo */}
//         {abaAtiva === "estoque" && (
//           <div className="divide-y divide-slate-100">
//             {ALERTAS_ESTOQUE_MOCK.map((item) => {
//               const porcentagem = Math.min(
//                 100,
//                 Math.round((item.saldoAtual / item.estoqueMinimo) * 100)
//               );

//               return (
//                 <div
//                   key={item.id}
//                   className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
//                 >
//                   <div className="space-y-1.5 flex-1 max-w-md">
//                     <div className="flex items-center gap-2">
//                       <span className="text-sm sm:text-base font-extrabold text-slate-900">
//                         {item.insumo}
//                       </span>
//                       <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
//                         {item.categoria}
//                       </span>
//                     </div>

//                     <div className="flex items-center gap-3 text-xs">
//                       <span className="font-bold text-rose-700">
//                         Atual: {item.saldoAtual} {item.unidade}
//                       </span>
//                       <span className="text-slate-400">/</span>
//                       <span className="text-slate-500 font-medium">
//                         Mínimo ideal: {item.estoqueMinimo} {item.unidade}
//                       </span>
//                     </div>

//                     {/* Barra de progresso do nível */}
//                     <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-rose-500 rounded-full"
//                         style={{ width: `${porcentagem}%` }}
//                       />
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
//                     <span className="text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
//                       Reposição Necessária
//                     </span>

//                     <Link
//                       href="/recebimento"
//                       className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
//                     >
//                       Dar Entrada
//                     </Link>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import {
  Clock,
  PackageX,
  Calendar,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface AlertaValidade {
  id: string;
  insumo: string;
  categoria: string;
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
  categoria: string;
  saldoAtual: number;
  estoqueMinimo: number;
  unidade: string;
}

const ALERTAS_VALIDADE: AlertaValidade[] = [
  {
    id: "v1",
    insumo: "Peito de Frango",
    categoria: "Proteínas & Frios",
    quantidade: 15,
    unidade: "Kg",
    dataValidade: "06/09/2026",
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
    dataValidade: "07/09/2026",
    diasRestantes: 3,
    fornecedor: "Cooperativa Vale do Ipojuca",
  },
  {
    id: "v3",
    insumo: "Tomate",
    categoria: "Hortifrúti",
    quantidade: 12,
    unidade: "Kg",
    dataValidade: "08/09/2026",
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
    estoqueMinimo: 15,
    unidade: "Lt",
  },
  {
    id: "e2",
    insumo: "Arroz Parboilizado",
    categoria: "Grãos & Cereais",
    saldoAtual: 20,
    estoqueMinimo: 50,
    unidade: "Kg",
  },
  {
    id: "e3",
    insumo: "Alho in natura",
    categoria: "Hortifrúti",
    saldoAtual: 1.5,
    estoqueMinimo: 5,
    unidade: "Kg",
  },
];

export default function CentralAlertasPage() {
  const [abaAtiva, setAbaAtiva] = useState<"validade" | "estoque">("validade");

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-6 pb-28">
      {/* 1. TOPO SIMPLES E EXPLICATIVO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-amber-800 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Quadro de Avisos da Cozinha
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Central de Alertas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consulte produtos que devem ser gastos primeiro e itens que estão acabando no estoque.
          </p>
        </div>

        <Link
          href="/consumo"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>Ir para Consumo Diário</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. BOTÕES GRANDES DE SELEÇÃO (ABAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setAbaAtiva("validade")}
          className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            abaAtiva === "validade"
              ? "bg-amber-50/80 border-amber-400 shadow-sm"
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
          className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            abaAtiva === "estoque"
              ? "bg-rose-50/80 border-rose-400 shadow-sm"
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
            Estoque Acabando (Crítico)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Itens no final que precisam ser informados à Nutrição / Compras.
          </p>
        </button>
      </div>

      {/* 3. LISTA LIMPA E SEM BOTÕES CONFUSOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-600" />
            <span>
              {abaAtiva === "validade"
                ? "Produtos Próximos ao Vencimento"
                : "Produtos com Quantidade Abaixo do Mínimo"}
            </span>
          </h3>

          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
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
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base sm:text-lg font-bold text-slate-900">
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

                {/* Selo Visual Claro de Prazo */}
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-300/80 px-4 py-2 rounded-xl text-amber-950 self-start sm:self-auto">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="text-left sm:text-right">
                    <p className="text-xs sm:text-sm font-black leading-tight">
                      Vence em {item.diasRestantes} dias
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium">
                      Data: {item.dataValidade}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LISTA 2: ESTOQUE BAIXO */}
        {abaAtiva === "estoque" && (
          <div className="divide-y divide-slate-100">
            {ALERTAS_ESTOQUE.map((item) => {
              const porcentagem = Math.min(
                100,
                Math.round((item.saldoAtual / item.estoqueMinimo) * 100)
              );

              return (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 max-w-md">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">
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
                      (mínimo recomendado: {item.estoqueMinimo} {item.unidade})
                    </p>

                    {/* Barra visual indicadora de nível */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                  </div>

                  <div className="self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Pedir Reposição</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Caixa Informativa de Apoio */}
      <div className="bg-slate-100/70 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 flex items-start gap-3">
        <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Dica para a equipe:</strong> Ao iniciar o turno, verifique esta lista para priorizar os pacotes abertos ou produtos que vencem primeiro no preparo do dia.
        </p>
      </div>
    </div>
  );
}