"use client";

import "./globals.css";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import { Menu, Loader2 } from "lucide-react";
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
  const router = useRouter();
  const { autenticado, carregando, perfil } = useAuth();
  const isAuthPage = pathname === "/" || pathname === "/login";

  useEffect(() => {
    if (carregando) return;

    // 1. Usuário não autenticado tentando acessar qualquer rota interna protegida
    if (!autenticado && !isAuthPage) {
      router.replace("/");
      return;
    }

    // 2. Usuário autenticado acessando a tela de login
    if (autenticado && isAuthPage) {
      if (perfil === "ADMIN") {
        router.replace("/usuarios");
      } else {
        router.replace("/consumo");
      }
      return;
    }

    // 3. Controle de acesso por perfil (RBAC) para rotas internas
    if (autenticado) {
      if (perfil === "COZINHA") {
        const rotasRestritasCozinha = ["/estoque", "/relatorios", "/cardapio", "/usuarios"];
        if (rotasRestritasCozinha.some((r) => pathname.startsWith(r))) {
          router.replace("/consumo");
        }
      } else if (perfil === "NUTRICIONISTA") {
        if (pathname.startsWith("/usuarios")) {
          router.replace("/consumo");
        }
      } else if (perfil === "ADMIN") {
        if (!pathname.startsWith("/usuarios")) {
          router.replace("/usuarios");
        }
      }
    }
  }, [autenticado, carregando, isAuthPage, pathname, perfil, router]);

  // Se for página de login
  if (isAuthPage) {
    return <main className="w-full h-full min-h-screen overflow-y-auto">{children}</main>;
  }

  // Se ainda estiver validando credenciais ou não autenticado
  if (carregando || !autenticado) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Verificando autorização...</span>
      </div>
    );
  }

  // Layout autenticado padrão com Sidebar e Header
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