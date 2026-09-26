"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Utensils,
  PackagePlus,
  Bell,
  Boxes,
  CalendarDays,
  BarChart3,
  Users,
  ArrowLeft,
  LogOut,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const {
    perfil,
    logout,
    menuMobileAberto,
    setMenuMobileAberto,
    totalAlertasPendentes,
  } = useAuth();

  // Links do Admin (gestão restrita de usuários)
  const linksAdmin = [
    { href: "/usuarios", label: "Gestão de Usuários", icon: Users },
  ];

  // Links da Cozinha (operacionais)
  const linksCozinha = [
    { href: "/consumo", label: "Consumo Diário", icon: Utensils },
    { href: "/recebimento", label: "Entradas", icon: PackagePlus },
    { href: "/alertas", label: "Central de Alertas", icon: Bell },
  ];

  // Links do Nutricionista (gestão e auditoria completa)
  const linksNutri = [
    { href: "/consumo", label: "Consumo Diário", icon: Utensils },
    { href: "/estoque", label: "Entradas & Estoque", icon: Boxes },
    { href: "/cardapio", label: "Cardápio Semanal", icon: CalendarDays },
    { href: "/relatorios", label: "Relatórios & Indicadores", icon: BarChart3 },
    { href: "/alertas", label: "Central de Alertas", icon: Bell },
  ];

  const linksAtuais =
    perfil === "ADMIN"
      ? linksAdmin
      : perfil === "COZINHA"
      ? linksCozinha
      : linksNutri;


  return (
    <>
      {/* Overlay mobile */}
      {menuMobileAberto && (
        <div
          onClick={() => setMenuMobileAberto(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          menuMobileAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Logo e botão fechar mobile */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="relative w-36 h-12">
              <Image
                src="/ifpe_bjpng.png"
                alt="Logo IFPE"
                fill
                sizes="144px"
                className="object-contain object-left"
              />
            </div>

            <button
              type="button"
              onClick={() => setMenuMobileAberto(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navegação dinâmica por perfil */}
          <nav className="space-y-1">
            {linksAtuais.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isAlerta = link.href === "/alertas";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuMobileAberto(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-emerald-700" : "text-slate-400"
                      }`}
                    />
                    <span>{link.label}</span>
                  </div>

                  {isAlerta && totalAlertasPendentes > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-red-600 text-white leading-none">
                      {totalAlertasPendentes}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé: Alternância de Perfil */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Perfil Atual:</span>
            <span className="font-bold text-slate-800 uppercase text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {perfil === "ADMIN"
                ? "Administrador"
                : perfil === "COZINHA"
                ? "Cozinha"
                : "Nutricionista"}
            </span>
          </div>

          {perfil === "ADMIN" || perfil === "NUTRICIONISTA" ? (
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>
          ) : (
            <Link
              href="/"
              onClick={() => setMenuMobileAberto(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Trocar de Perfil / Início</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}