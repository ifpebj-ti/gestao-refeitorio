"use client";

import "./globals.css";
import { useState, useRef, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import { Menu, Bell, Clock, PackageX, ChevronRight } from "lucide-react";
import Link from "next/link";

function HeaderComSininho() {
  const { toggleMenuMobile, perfil, totalAlertasPendentes, dispensarBannerAlertas } = useAuth();
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Lado Esquerdo: Menu Mobile + Título Neutro */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMenuMobile}
          className="lg:hidden p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <span className="text-sm font-semibold text-slate-700 tracking-tight hidden sm:inline-block">
          REFEITÓRIO - IFPE CAMPUS BELO JARDIM
        </span>
      </div>

      {/* Lado Direito: Sininho + Perfil Neutro */}
      <div className="flex items-center gap-3">
        {/* Sininho com Dropdown */}
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer focus:outline-none"
            aria-label="Ver Alertas"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {totalAlertasPendentes > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-600 text-white rounded-full text-[11px] font-black flex items-center justify-center shadow-xs border-2 border-white leading-none z-10">
                {totalAlertasPendentes}
              </span>
            )}
          </button>

          {/* Menu Dropdown Minimalista */}
          {dropdownAberto && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                  Alertas Ativos
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {totalAlertasPendentes} avisos
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 first:pt-1 flex items-center justify-between gap-3">
                  <span className="text-slate-800 font-medium truncate">Peito de Frango</span>
                  <span className="text-[11px] text-amber-700 font-bold shrink-0">
                    Vence em 2d
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between gap-3">
                  <span className="text-slate-800 font-medium truncate">Leite in natura</span>
                  <span className="text-[11px] text-amber-700 font-bold shrink-0">
                    Vence em 3d
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between gap-3">
                  <span className="text-slate-800 font-medium truncate">Óleo Vegetal</span>
                  <span className="text-[11px] text-rose-700 font-bold shrink-0">
                    4 Lt restantes
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between gap-3">
                  <span className="text-slate-800 font-medium truncate">Arroz Parboilizado</span>
                  <span className="text-[11px] text-rose-700 font-bold shrink-0">
                    Abaixo do mín.
                  </span>
                </div>
              </div>

              <Link
                href="/alertas"
                onClick={() => {
                  setDropdownAberto(false);
                  dispensarBannerAlertas();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 mt-2"
              >
                <span>Ver Quadro Completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Identificação de Perfil Minimalista */}
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 uppercase tracking-wider">
          {perfil === "COZINHA" ? "Cozinha" : "Nutricionista"}
        </span>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full antialiased text-slate-900 bg-slate-50">
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
              <HeaderComSininho />
              <main className="flex-1 w-full">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}