// "use client";

// import { createContext, useContext, useState, ReactNode } from "react";

// export type PerfilUsuario = "COZINHA" | "NUTRICIONISTA";

// interface AuthContextType {
//   perfil: PerfilUsuario;
//   alternarPerfil: () => void;
//   menuMobileAberto: boolean;
//   setMenuMobileAberto: (aberto: boolean) => void;
//   toggleMenuMobile: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [perfil, setPerfil] = useState<PerfilUsuario>("COZINHA");
//   const [menuMobileAberto, setMenuMobileAberto] = useState(false);

//   const alternarPerfil = () => {
//     setPerfil((prev) => (prev === "COZINHA" ? "NUTRICIONISTA" : "COZINHA"));
//   };

//   const toggleMenuMobile = () => {
//     setMenuMobileAberto((prev) => !prev);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         perfil,
//         alternarPerfil,
//         menuMobileAberto,
//         setMenuMobileAberto,
//         toggleMenuMobile,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth deve ser usado dentro de um AuthProvider");
//   }
//   return context;
// }

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilUsuario>("COZINHA");
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [bannerAlertasVisivel, setBannerAlertasVisivel] = useState(true);

  // Quantidade total de alertas ativos (3 vencendo + 3 estoque baixo)
  const totalAlertasPendentes = 6;

  const alternarPerfil = () => {
    setPerfil((prev) => (prev === "COZINHA" ? "NUTRICIONISTA" : "COZINHA"));
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