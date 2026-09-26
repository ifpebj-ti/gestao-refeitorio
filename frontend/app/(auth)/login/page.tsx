"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/app/context/AuthContext";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { loginComGoogle } = useAuth();
  const [erro, setErro] = useState<string | null>(null);

  const handleSucesso = async (credentialResponse: CredentialResponse) => {
    setErro(null);
    if (!credentialResponse.credential) {
      setErro("Nenhuma credencial retornada pelo Google.");
      return;
    }

    try {
      await loginComGoogle(credentialResponse.credential);
    } catch (err: any) {
      setErro(err.message || "E-mail não autorizado ou inativo no sistema.");
    }
  };

  const handleErro = () => {
    setErro("Falha ao abrir a autenticação do Google. Tente novamente.");
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 overflow-hidden">
      {/* Efeitos visuais de fundo: Mesh Gradients Suaves */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-300/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-300/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de retorno para a tela inicial */}
      <div className="w-full max-w-md mb-4 flex items-center justify-start z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 text-xs font-bold text-slate-600 hover:text-emerald-700 shadow-2xs backdrop-blur-xs transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Voltar ao Início</span>
        </Link>
      </div>

      {/* Card Principal / Modal de Login */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow max-w-md w-full p-8 sm:p-10 space-y-6">
        {/* Topo do Card: Badge + Logo + Títulos */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Acesso Restrito
            </span>
          </div>

          <div className="flex justify-center py-1">
            <div className="relative w-28 h-20">
              <Image
                src="/ifpe_bjpng.png"
                alt="Logo IFPE Campus Belo Jardim"
                fill
                sizes="112px"
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
              Autentique-se com sua conta Google institucional para acessar o painel de nutrição e administração.
            </p>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{erro}</span>
          </div>
        )}

        {/* Botão Oficial do Google Login */}
        <div className="flex flex-col items-center justify-center pt-2 space-y-4">
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

          <p className="text-[11px] text-slate-400 text-center max-w-xs leading-normal">
            Permitido apenas para usuários cadastrados com e-mail institucional ou autorizados pela gestão.
          </p>
        </div>
      </div>

      {/* Rodapé Institucional */}
      <footer className="mt-8 text-center z-10">
        <p className="text-xs text-slate-400 font-medium">
          Instituto Federal de Pernambuco • Campus Belo Jardim
        </p>
      </footer>
    </div>
  );
}