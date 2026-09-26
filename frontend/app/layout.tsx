"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";
import { GoogleOAuthProvider } from "@react-oauth/google";

function Header() {
  const { toggleMenuMobile, perfil } = useAuth();

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

      {/* Lado Direito */}
      <div className="flex items-center gap-3">
        {perfil === "ADMIN" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200/60 rounded-xl text-xs font-bold text-purple-800">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span>Painel Administrativo</span>
          </div>
        )}
      </div>
    </header>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = pathname === "/" || pathname === "/login";

  if (isFullscreen) {
    return <main className="w-full h-full min-h-screen overflow-y-auto">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 w-full overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full antialiased text-slate-900 bg-slate-50 overflow-hidden">
        <GoogleOAuthProvider clientId={clientId}>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}