"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type PerfilUsuario = "COZINHA" | "NUTRICIONISTA";

interface AuthContextType {
  perfil: PerfilUsuario;
  autenticado: boolean;
  carregando: boolean; // <-- Adicionado para evitar falso logout no F5/URL direta
  menuMobileAberto: boolean;
  setMenuMobileAberto: (aberto: boolean) => void;
  totalAlertasPendentes: number;
  bannerAlertasVisivel: boolean;
  validarPin: (pin: string) => boolean;
  logout: () => void;
  toggleMenuMobile: () => void;
  fecharMenuMobile: () => void;
  dispensarBannerAlertas: () => void;
}

const PIN_MESTRE_NUTRI = "1234";
const STORAGE_KEY = "@nutrifpe:auth_perfil";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilUsuario>("COZINHA");
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true); // Começa true até ler o storage
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [bannerAlertasVisivel, setBannerAlertasVisivel] = useState(true);

  const totalAlertasPendentes = 4;

  // Restaura sessão do sessionStorage
  useEffect(() => {
    try {
      const perfilSalvo = sessionStorage.getItem(STORAGE_KEY);
      if (perfilSalvo === "NUTRICIONISTA") {
        setPerfil("NUTRICIONISTA");
        setAutenticado(true);
      }
    } catch (e) {
      console.error("Erro ao ler sessão:", e);
    } finally {
      setCarregando(false); // Checagem finalizada
    }
  }, []);

  const toggleMenuMobile = () => setMenuMobileAberto((prev) => !prev);
  const fecharMenuMobile = () => setMenuMobileAberto(false);

  const validarPin = (pinDigitado: string): boolean => {
    if (pinDigitado === PIN_MESTRE_NUTRI) {
      setPerfil("NUTRICIONISTA");
      setAutenticado(true);
      sessionStorage.setItem(STORAGE_KEY, "NUTRICIONISTA");
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPerfil("COZINHA");
    setAutenticado(false);
    router.push("/consumo");
  };

  const dispensarBannerAlertas = () => {
    setBannerAlertasVisivel(false);
  };

  return (
    <AuthContext.Provider
      value={{
        perfil,
        autenticado,
        carregando,
        menuMobileAberto,
        setMenuMobileAberto,
        totalAlertasPendentes,
        bannerAlertasVisivel,
        validarPin,
        logout,
        toggleMenuMobile,
        fecharMenuMobile,
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
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}