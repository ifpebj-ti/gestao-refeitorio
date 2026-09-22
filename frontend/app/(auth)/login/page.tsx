"use client";

import { useState } from "react";
import Image from "next/image";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/app/context/AuthContext";

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
<div className="h-[calc(100vh-4.25rem)] w-full flex flex-col items-center justify-center -mt-6 p-4 overflow-hidden bg-slate-50">      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-sm w-full p-6 sm:p-8 space-y-6">

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Image
              src="/ifpe_bjpng.png"
              alt="Logo IFPE"
              width={72}
              height={72}
              priority
            />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Refeitório
          </h1>
          <p className="text-xs text-slate-500">
            Acesso ao sistema com conta Google
          </p>
        </div>

        {erro && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center">
            {erro}
          </div>
        )}

        <div className="flex justify-center pt-2">
          <GoogleLogin
            onSuccess={handleSucesso}
            onError={handleErro}
            useOneTap
            shape="pill"
            text="signin_with"
          />
        </div>

      </div>
    </div>
  );
}