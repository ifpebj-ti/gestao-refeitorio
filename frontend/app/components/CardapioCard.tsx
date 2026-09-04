// import { Sparkles } from "lucide-react";

// export interface DadosCardapio {
//   pratoPrincipal: string;
//   acompanhamentos: string[];
//   sobremesa?: string;
// }

// interface CardapioCardProps {
//   refeicao: string;
//   dados: DadosCardapio;
//   responsavel?: string;
// }

// export default function CardapioCard({
//   refeicao,
//   dados,
//   responsavel = "Nutricionista Hítalo",
// }: CardapioCardProps) {
//   return (
//     <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border-2 border-emerald-200/90 rounded-2xl p-6 shadow-sm">
//       <div className="flex items-start justify-between gap-4">
//         <div className="space-y-2">
//           <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm tracking-wide uppercase">
//             <Sparkles className="w-4 h-4 text-emerald-600" />
//             <span>Cardápio Previsto para este {refeicao} (Nutrição)</span>
//           </div>

//           <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
//             {dados.pratoPrincipal}
//           </h2>

//           <div className="flex flex-wrap items-center gap-2 pt-1">
//             <span className="text-xs font-semibold text-slate-500">
//               Acompanhamentos:
//             </span>
//             {dados.acompanhamentos.map((acomp, idx) => (
//               <span
//                 key={idx}
//                 className="bg-white border border-emerald-200 text-slate-700 text-xs px-3 py-1 rounded-lg font-medium shadow-2xs"
//               >
//                 {acomp}
//               </span>
//             ))}
//             {dados.sobremesa && (
//               <span className="bg-emerald-100/70 text-emerald-900 border border-emerald-300 text-xs px-3 py-1 rounded-lg font-semibold">
//                 Sobremesa: {dados.sobremesa}
//               </span>
//             )}
//           </div>
//         </div>

//         <div className="hidden sm:flex flex-col items-end text-right shrink-0">
//           <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
//             Planejamento Semanal
//           </span>
//           <span className="text-xs font-bold text-slate-700 mt-0.5">
//             {responsavel}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }


import { Sparkles, Tv } from "lucide-react";

interface CardapioCardProps {
  refeicao: string;
  descricao: string;
  responsavel?: string;
}

export default function CardapioCard({
  refeicao,
  descricao,
  responsavel = "Nutricionista Hítalo",
}: CardapioCardProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border-2 border-emerald-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 max-w-4xl">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm tracking-wide uppercase">
            <Tv className="w-4 h-4 text-emerald-600 shrink-0" />
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
            {responsavel}
          </span>
        </div>
      </div>
    </div>
  );
}