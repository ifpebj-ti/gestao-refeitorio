"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export type PerfilUsuario = "COZINHA" | "NUTRICIONISTA";

interface AuthContextType {
  perfil: PerfilUsuario;
  alternarPerfil: () => void;
  menuMobileAberto: boolean;
  setMenuMobileAberto: (aberto: boolean) => void;
  toggleMenuMobile: () => void;
  totalAlertasPendentes: number;
  bannerAlertasVisivel: boolean;
  dispensarBannerAlertas: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rotas restritas e exclusivas de cada perfil
const ROTAS_EXCLUSIVAS_NUTRI = ["/estoque", "/cardapio", "/relatorios"];
const ROTAS_EXCLUSIVAS_COZINHA = ["/recebimento"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [perfil, setPerfil] = useState<PerfilUsuario>("COZINHA");
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [bannerAlertasVisivel, setBannerAlertasVisivel] = useState(true);

  const totalAlertasPendentes = 6;

  // Guarda de rota em tempo real (bloqueia URL digitada ou transições diretas)
  useEffect(() => {
    if (!pathname) return;

    if (perfil === "COZINHA" && ROTAS_EXCLUSIVAS_NUTRI.some((r) => pathname.startsWith(r))) {
      router.replace("/consumo");
    } else if (perfil === "NUTRICIONISTA" && ROTAS_EXCLUSIVAS_COZINHA.some((r) => pathname.startsWith(r))) {
      router.replace("/estoque");
    }
  }, [perfil, pathname, router]);

  const alternarPerfil = () => {
    setPerfil((prev) => {
      const novoPerfil = prev === "COZINHA" ? "NUTRICIONISTA" : "COZINHA";

      if (novoPerfil === "COZINHA" && ROTAS_EXCLUSIVAS_NUTRI.some((r) => pathname.startsWith(r))) {
        router.replace("/consumo");
      } else if (novoPerfil === "NUTRICIONISTA" && ROTAS_EXCLUSIVAS_COZINHA.some((r) => pathname.startsWith(r))) {
        router.replace("/estoque");
      }

      return novoPerfil;
    });
  };

  const toggleMenuMobile = () => {
    setMenuMobileAberto((prev) => !prev);
  };

  const dispensarBannerAlertas = () => {
    setBannerAlertasVisivel(false);
  };

  return (
    <AuthContext.Provider
      value={{
        perfil,
        alternarPerfil,
        menuMobileAberto,
        setMenuMobileAberto,
        toggleMenuMobile,
        totalAlertasPendentes,
        bannerAlertasVisivel,
        dispensarBannerAlertas,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}