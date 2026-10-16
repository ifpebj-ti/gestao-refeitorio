"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "./context/AuthContext";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginComGoogle, autenticado, perfil, carregando } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!carregando && autenticado) {
      if (perfil === "ADMIN") {
        router.replace("/usuarios");
      } else {
        router.replace("/consumo");
      }
    }
  }, [autenticado, carregando, perfil, router]);

  const handleSucesso = async (credentialResponse: CredentialResponse) => {
    setErro(null);
    if (!credentialResponse.credential) {
      setErro("Nenhuma credencial retornada pelo Google.");
      return;
    }

    try {
      setProcessando(true);
      await loginComGoogle(credentialResponse.credential);
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "E-mail não autorizado ou inativo no sistema."
      );
    } finally {
      setProcessando(false);
    }
  };

  const handleErro = () => {
    setErro("Falha ao abrir a autenticação do Google. Tente novamente.");
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-slate-50 overflow-hidden select-none">
      {/* Efeitos visuais de fundo: Mesh Gradients modernos e suaves */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Espaço superior para equilíbrio */}
      <div className="w-full" />

      {/* Bloco Central: Layout Minimalista, Amplo e Moderno */}
      <main className="relative z-10 w-full max-w-5xl mx-auto my-auto flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Lado Esquerdo: Identidade do Refeitório IFPE com Grande Impacto Visual */}
        <div className="text-center md:text-left space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-100/80 border border-emerald-300/60 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wider text-emerald-800 uppercase">
              IFPE • Campus Belo Jardim
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">
            Refeitório{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
              IFPE
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-500 font-normal leading-relaxed max-w-md">
            Sistema integrado de gestão alimentar e controle de refeições do campus.
          </p>
        </div>

        {/* Lado Direito: Modal de Login Clean */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-900/5 p-8 sm:p-10 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative w-36 h-16">
              <Image
                src="/ifpe_bjpng.png"
                alt="Logo IFPE"
                fill
                sizes="144px"
                priority
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Iniciar Sessão
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Entre com sua conta Google autorizada
              </p>
            </div>
          </div>

          {/* Feedback de Erro */}
          {erro && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{erro}</span>
            </div>
          )}

          {/* Botão de Login Google */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-1">
            {processando ? (
              <div className="w-full py-3 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Autenticando...</span>
              </div>
            ) : (
              <div className="w-full flex justify-center shadow-2xs rounded-full overflow-hidden">
                <GoogleLogin
                  onSuccess={handleSucesso}
                  onError={handleErro}
                  shape="pill"
                  size="large"
                  width="280"
                  text="signin_with"
                />
              </div>
            )}
            <p className="text-[11px] text-slate-400 text-center">
              O acesso é direcionado de acordo com seu perfil.
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé Simples */}
      <footer className="relative z-10 w-full text-center py-2 text-xs text-slate-400">
        Instituto Federal de Pernambuco — Campus Belo Jardim
      </footer>
    </div>
  );
}