"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "./context/AuthContext";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { loginComGoogle, autenticado, perfil, carregando } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  // Redireciona automaticamente se já estiver autenticado
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 bg-slate-50 overflow-hidden select-none">
      {/* Efeitos visuais de fundo: Mesh Gradients Suaves */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Espaçador superior para equilíbrio de centralização */}
      <div className="w-full max-w-md pt-2" />

      {/* Card Principal de Autenticação Unificada */}
      <main className="relative z-10 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-xl hover:shadow-2xl transition-all max-w-md w-full p-8 sm:p-10 space-y-6 my-auto">
        {/* Topo do Card: Badge Institucional + Logo IFPE */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Acesso ao Sistema
            </span>
          </div>

          <div className="flex justify-center py-2">
            <div className="relative w-36 h-18">
              <Image
                src="/ifpe_bjpng.png"
                alt="Logo IFPE Campus Belo Jardim"
                fill
                sizes="144px"
                priority
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestão de Refeitório
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Entre com sua conta Google para acessar seu ambiente de trabalho (Cozinha, Nutrição ou Administração).
            </p>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{erro}</span>
          </div>
        )}

        {/* Botão Oficial do Google Login */}
        <div className="flex flex-col items-center justify-center pt-2 space-y-4">
          {processando ? (
            <div className="py-3 px-6 bg-slate-50 border border-slate-200 rounded-full flex items-center gap-2.5 text-xs font-bold text-slate-700 shadow-2xs">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Autenticando credenciais...</span>
            </div>
          ) : (
            <div className="shadow-2xs rounded-full overflow-hidden">
              <GoogleLogin
                onSuccess={handleSucesso}
                onError={handleErro}
                shape="pill"
                size="large"
                width="300"
                text="signin_with"
              />
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center max-w-xs leading-normal">
            Acesso restrito. O direcionamento para a sua área é automático de acordo com o seu perfil cadastrado.
          </p>
        </div>
      </main>

      {/* Rodapé Institucional Limpo */}
      <footer className="relative z-10 w-full text-center pb-2">
        <p className="text-xs text-slate-400 font-medium">
          Instituto Federal de Pernambuco — Campus Belo Jardim
        </p>
      </footer>
    </div>
  );
}