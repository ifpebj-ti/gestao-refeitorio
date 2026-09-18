"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type PerfilUsuario = "ADMIN" | "NUTRICIONISTA" | "COZINHA";

interface UsuarioAuth {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

interface AuthContextType {
  perfil: PerfilUsuario;
  usuario: UsuarioAuth | null;
  token: string | null;
  autenticado: boolean;
  carregando: boolean;
  menuMobileAberto: boolean;
  setMenuMobileAberto: (aberto: boolean) => void;
  totalAlertasPendentes: number;
  bannerAlertasVisivel: boolean;
  loginComGoogle: (idToken: string) => Promise<void>;
  validarPin: (pin: string) => boolean;
  logout: () => void;
  toggleMenuMobile: () => void;
  fecharMenuMobile: () => void;
  dispensarBannerAlertas: () => void;
}

const PIN_MESTRE_NUTRI = "1234";
const STORAGE_TOKEN_KEY = "@gestao_refeitorio:token";
const STORAGE_USER_KEY = "@gestao_refeitorio:user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilUsuario>("COZINHA");
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [bannerAlertasVisivel, setBannerAlertasVisivel] = useState(true);

  const totalAlertasPendentes = 4;

  useEffect(() => {
    try {
      const tokenSalvo = localStorage.getItem(STORAGE_TOKEN_KEY);
      const userSalvo = localStorage.getItem(STORAGE_USER_KEY);

      if (tokenSalvo && userSalvo) {
        const dadosUser: UsuarioAuth = JSON.parse(userSalvo);
        setToken(tokenSalvo);
        setUsuario(dadosUser);
        setPerfil(dadosUser.perfil);
        setAutenticado(true);
      }
    } catch (e) {
      console.error("Erro ao ler sessão local:", e);
    } finally {
      setCarregando(false);
    }
  }, []);

  const toggleMenuMobile = () => setMenuMobileAberto((prev) => !prev);
  const fecharMenuMobile = () => setMenuMobileAberto(false);

  const loginComGoogle = async (idToken: string) => {
    const response = await fetch("http://localhost:8080/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const erro = await response.json().catch(() => null);
      throw new Error(erro?.message || "Falha na autenticação institucional com Google.");
    }

    const data: { token: string; nome: string; email: string; perfil: PerfilUsuario } = await response.json();

    const dadosUsuario: UsuarioAuth = {
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
    };

    setToken(data.token);
    setUsuario(dadosUsuario);
    setPerfil(data.perfil);
    setAutenticado(true);

    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(dadosUsuario));

    if (data.perfil === "COZINHA") {
      router.push("/consumo");
    } else {
      router.push("/estoque");
    }
  };

  const validarPin = (pinDigitado: string): boolean => {
    if (pinDigitado === PIN_MESTRE_NUTRI) {
      setPerfil("NUTRICIONISTA");
      setAutenticado(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setToken(null);
    setUsuario(null);
    setPerfil("COZINHA");
    setAutenticado(false);
    router.push("/login");
  };

  const dispensarBannerAlertas = () => {
    setBannerAlertasVisivel(false);
  };

  return (
    <AuthContext.Provider
      value={{
        perfil,
        usuario,
        token,
        autenticado,
        carregando,
        menuMobileAberto,
        setMenuMobileAberto,
        totalAlertasPendentes,
        bannerAlertasVisivel,
        loginComGoogle,
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