"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  PackagePlus,
  Bell,
  Package,
  CalendarDays,
  BarChart3,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  perfil: "COZINHA" | "NUTRICIONISTA";
}

export default function Sidebar({ perfil }: SidebarProps) {
  const pathname = usePathname();

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
    <aside className="w-64 bg-white border-r border-slate-200 text-slate-700 min-h-screen flex flex-col justify-between p-4 shrink-0 select-none">
      <div>
        {/* Logo Institucional */}
        <div className="pb-5 pt-1 px-1 border-b border-slate-100 flex items-center justify-center">
          <Image
            src="/ifpe_bjpng.png"
            alt="IFPE Campus Belo Jardim"
            width={200}
            height={60}
            priority
            className="w-auto h-12 object-contain"
          />
        </div>

        {/* Badge do Perfil */}
        <div className="my-4 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs flex items-center justify-between">
          <span className="text-slate-500 font-medium">Perfil:</span>
          <span className="text-emerald-700 font-bold uppercase tracking-wide">
            {perfil === "COZINHA" ? "Cozinha" : "Nutricionista"}
          </span>
        </div>

        {/* Menu de Navegação */}
        <nav className="space-y-1 mt-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair / Trocar Acesso</span>
        </Link>
      </div>
    </aside>
  );
}