"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { Utensils, ClipboardList, ArrowRight, Shield } from "lucide-react";

export default function WelcomeSplashPage() {
  const router = useRouter();
  const { entrarComoCozinha, autenticado, perfil } = useAuth();

  const handleEntrarCozinha = () => {
    entrarComoCozinha();
  };

  const handleEntrarNutricionista = () => {
    if (autenticado && perfil === "NUTRICIONISTA") {
      router.push("/estoque");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between p-4 sm:p-8 text-slate-900">
      {/* Topo: Identidade Visual Institucional */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-center pt-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative w-40 h-14">
            <Image
              src="/ifpe_bjpng.png"
              alt="Logo IFPE Campus Belo Jardim"
              fill
              sizes="160px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Campus Belo Jardim</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Gestão de Refeitório</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Central: Seleção Enxuta de Perfis */}
      <main className="max-w-3xl w-full mx-auto my-auto py-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Selecione o Acesso
          </h1>
          <p className="text-sm text-slate-600">
            Escolha o ambiente de trabalho correspondente à sua atividade
          </p>
        </div>

        {/* Grid com os 2 Cartões Limpos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Cozinha (Acesso Livre) */}
          <div
            onClick={handleEntrarCozinha}
            className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Sem Senha
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Área da Cozinha
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Lançamento de consumo diário por refeição, recebimento de mercadorias e alertas do tablet.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span>Entrar na Cozinha</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 2: Nutricionista (Acesso com Google) */}
          <div
            onClick={handleEntrarNutricionista}
            className="bg-white border-2 border-slate-200 hover:border-sky-500 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Google</span>
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-sky-800 transition-colors">
                  Área do Nutricionista
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Gestão completa do estoque, conferência de consumo, cardápio semanal e relatórios.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span>Acessar como Nutricionista</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer da Página */}
      <footer className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 text-xs text-slate-400">
        <span>Instituto Federal de Pernambuco — Campus Belo Jardim</span>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-slate-400 hover:text-slate-700 hover:underline transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
        >
          <Shield className="w-3 h-3" />
          <span>Acesso Administrativo</span>
        </button>
      </footer>
    </div>
  );
}