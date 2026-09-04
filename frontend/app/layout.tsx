"use client";

import "./globals.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";

function TopbarMobile() {
  const { toggleMenuMobile, perfil } = useAuth();

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <button
        type="button"
        onClick={toggleMenuMobile}
        className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        aria-label="Abrir Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
        {perfil === "COZINHA" ? "Cozinha" : "Nutricionista"}
      </span>
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
              <TopbarMobile />
              <main className="flex-1 w-full">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}