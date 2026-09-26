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
  setPerfil: (perfil: PerfilUsuario) => void;
  usuario: UsuarioAuth | null;
  token: string | null;
  autenticado: boolean;
  carregando: boolean;
  menuMobileAberto: boolean;
  setMenuMobileAberto: (aberto: boolean) => void;
  totalAlertasPendentes: number;
  setTotalAlertasPendentes: (total: number) => void;
  bannerAlertasVisivel: boolean;
  loginComGoogle: (idToken: string) => Promise<void>;
  validarPin: (pin: string) => boolean;
  logout: () => void;
  voltarParaCozinha: () => void;
  entrarComoCozinha: () => void;
  toggleMenuMobile: () => void;
  fecharMenuMobile: () => void;
  dispensarBannerAlertas: () => void;
}

const PIN_MESTRE_NUTRI = "1234";
const STORAGE_TOKEN_KEY = "@gestao_refeitorio:token";
const STORAGE_USER_KEY = "@gestao_refeitorio:user";
const STORAGE_PERFIL_KEY = "@gestao_refeitorio:perfil_ativo";

import { produtoService } from "@/lib/produtos";
import { calcularTotalAlertas } from "@/lib/alertasCount";

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

  // Inicializa com o total persistido para aparecer imediatamente sem atraso
  const [totalAlertasPendentes, setTotalAlertasPendentesState] = useState<number>(() => {
    try {
      if (typeof window !== "undefined") {
        const salvo = localStorage.getItem("@gestao_refeitorio:total_alertas");
        if (salvo !== null) return parseInt(salvo, 10) || 0;
      }
    } catch {}
    return 0;
  });

  const setTotalAlertasPendentes = (total: number) => {
    setTotalAlertasPendentesState(total);
    try {
      localStorage.setItem("@gestao_refeitorio:total_alertas", String(total));
    } catch {}
  };

  // Carrega e atualiza a contagem de alertas automaticamente na inicializacao
  useEffect(() => {
    let montado = true;
    async function carregarAlertasGlobais() {
      try {
        const prods = await produtoService.listar();
        if (montado && prods && prods.length > 0) {
          const total = calcularTotalAlertas(prods);
          setTotalAlertasPendentes(total);
        }
      } catch (err) {
        // ignora se offline
      }
    }
    carregarAlertasGlobais();
    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    try {
      const tokenSalvo = localStorage.getItem(STORAGE_TOKEN_KEY);
      const userSalvo = localStorage.getItem(STORAGE_USER_KEY);
      const perfilSalvo = localStorage.getItem(STORAGE_PERFIL_KEY) as PerfilUsuario | null;

      if (tokenSalvo && userSalvo) {
        const dadosUser: UsuarioAuth = JSON.parse(userSalvo);
        setToken(tokenSalvo);
        setUsuario(dadosUser);
        setPerfil(perfilSalvo || dadosUser.perfil);
        setAutenticado(true);
      } else if (perfilSalvo) {
        setPerfil(perfilSalvo);
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
    localStorage.setItem(STORAGE_PERFIL_KEY, data.perfil);

    if (data.perfil === "COZINHA") {
      router.push("/consumo");
    } else if (data.perfil === "ADMIN") {
      router.push("/usuarios");
    } else {
      router.push("/consumo");
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
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_PERFIL_KEY);
    } catch (e) {
      console.error("Erro ao limpar sessão local no logout:", e);
    }
    setToken(null);
    setUsuario(null);
    setPerfil("COZINHA");
    setAutenticado(false);
    setMenuMobileAberto(false);
    router.push("/");
  };

  const voltarParaCozinha = () => {
    try {
      localStorage.setItem(STORAGE_PERFIL_KEY, "COZINHA");
    } catch (e) {
      console.error("Erro ao salvar perfil da cozinha:", e);
    }
    setPerfil("COZINHA");
    setMenuMobileAberto(false);
    router.push("/consumo");
  };

  const entrarComoCozinha = () => {
    try {
      localStorage.setItem(STORAGE_PERFIL_KEY, "COZINHA");
    } catch (e) {
      console.error("Erro ao salvar perfil da cozinha:", e);
    }
    setPerfil("COZINHA");
    setMenuMobileAberto(false);
    router.push("/consumo");
  };

  const dispensarBannerAlertas = () => {
    setBannerAlertasVisivel(false);
  };

  return (
    <AuthContext.Provider
      value={{
        perfil,
        setPerfil,
        usuario,
        token,
        autenticado,
        carregando,
        menuMobileAberto,
        setMenuMobileAberto,
        totalAlertasPendentes,
        setTotalAlertasPendentes,
        bannerAlertasVisivel,
        loginComGoogle,
        validarPin,
        logout,
        voltarParaCozinha,
        entrarComoCozinha,
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