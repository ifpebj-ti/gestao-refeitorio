"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  UtensilsCrossed,
  PackagePlus,
  Bell,
  Package,
  CalendarDays,
  BarChart3,
  RefreshCw,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { perfil, alternarPerfil, menuMobileAberto, setMenuMobileAberto } = useAuth();

  const linksCozinha = [
    { href: "/consumo", label: "Consumo Diário", icon: UtensilsCrossed },
    { href: "/recebimento", label: "Registrar Entrada", icon: PackagePlus },
    { href: "/alertas", label: "Central de Alertas", icon: Bell },
  ];

  const linksNutricionista = [
    { href: "/consumo", label: "Consumo Diário", icon: UtensilsCrossed },
    { href: "/estoque", label: "Entradas & Estoque", icon: Package },
    { href: "/cardapio", label: "Cardápio Semanal", icon: CalendarDays },
    { href: "/relatorios", label: "Relatórios & Gráficos", icon: BarChart3 },
    { href: "/notificacoes", label: "Notificações & Lembretes", icon: Bell },
  ];

  const links = perfil === "COZINHA" ? linksCozinha : linksNutricionista;

  return (
    <>
      {/* Backdrop para telas mobile/tablet */}
      {menuMobileAberto && (
        <div
          onClick={() => setMenuMobileAberto(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Drawer da Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          menuMobileAberto ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } shrink-0 select-none`}
      >
        <div>
          {/* Topo com Logo e botão fechar mobile */}
          <div className="pb-4 pt-1 px-1 border-b border-slate-100 flex items-center justify-between">
            <Image
              src="/ifpe_bjpng.png"
              alt="IFPE Campus Belo Jardim"
              width={180}
              height={50}
              priority
              className="w-auto h-10 object-contain"
            />
            <button
              type="button"
              onClick={() => setMenuMobileAberto(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge Perfil */}
          <div className="my-4 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between">
            <span className="text-slate-500 font-medium">Perfil:</span>
            <span className="text-emerald-700 font-bold uppercase tracking-wide">
              {perfil === "COZINHA" ? "Cozinha" : "Nutricionista"}
            </span>
          </div>

          {/* Navegação */}
          <nav className="space-y-1 mt-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuMobileAberto(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span>Usuário:</span>
            <span className="font-semibold text-slate-700">
              {perfil === "COZINHA" ? "Equipe Cozinha" : "Hítalo (Nutri)"}
            </span>
          </div>

          <button
            type="button"
            onClick={alternarPerfil}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Alternar Perfil</span>
          </button>
        </div>
      </aside>
    </>
  );
}