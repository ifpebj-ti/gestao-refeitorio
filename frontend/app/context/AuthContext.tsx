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
  logout: () => void;
  toggleMenuMobile: () => void;
  fecharMenuMobile: () => void;
  dispensarBannerAlertas: () => void;
}
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

  // Inicializa com 0 para evitar hydration mismatch no SSR, carregando do localStorage após montagem
  const [totalAlertasPendentes, setTotalAlertasPendentesState] = useState<number>(0);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("@gestao_refeitorio:total_alertas");
      if (salvo !== null) {
        const parsed = parseInt(salvo, 10);
        if (!isNaN(parsed)) setTotalAlertasPendentesState(parsed);
      }
    } catch {}
  }, []);

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
      } else {
        setToken(null);
        setUsuario(null);
        setAutenticado(false);
      }
    } catch (e) {
      console.error("Erro ao ler sessão local:", e);
      setToken(null);
      setUsuario(null);
      setAutenticado(false);
    } finally {
      setCarregando(false);
    }
  }, []);

  const toggleMenuMobile = () => setMenuMobileAberto((prev) => !prev);
  const fecharMenuMobile = () => setMenuMobileAberto(false);

  const loginComGoogle = async (idToken: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const response = await fetch(`${baseUrl}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const erro = await response.json().catch(() => null);
      throw new Error(erro?.mensagem || erro?.message || "E-mail não autorizado ou inativo no sistema.");
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

    if (data.perfil === "ADMIN") {
      router.push("/usuarios");
    } else {
      router.push("/consumo");
    }
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
    router.replace("/");
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