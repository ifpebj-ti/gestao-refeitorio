"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "./context/AuthContext";
import {
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Lock,
  Boxes,
  CalendarDays,
  FileSpreadsheet,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginComGoogle, loginComCredenciais, autenticado, perfil, carregando } = useAuth();
  const [loginMobileAberto, setLoginMobileAberto] = useState(false);
  const [modoLogin, setModoLogin] = useState<"google" | "credenciais">("google");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaResetKey, setSenhaResetKey] = useState(0);
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

  const abrirLoginCredenciais = () => {
    setErro(null);
    setSenha("");
    setSenhaResetKey((prev) => prev + 1);
    setModoLogin("credenciais");
  };

  const voltarParaGoogle = () => {
    setErro(null);
    setSenha("");
    setSenhaResetKey((prev) => prev + 1);
    setModoLogin("google");
  };

  const handleLoginCredenciais = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha) {
      setErro("Informe seu usuário (e-mail) e senha.");
      return;
    }

    try {
      setProcessando(true);
      await loginComCredenciais(email, senha);
    } catch (err: unknown) {
      setSenha("");
      setSenhaResetKey((prev) => prev + 1);
      setErro(
        err instanceof Error ? err.message : "E-mail ou senha inválidos."
      );
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-slate-50 overflow-hidden select-none">
      {/* Efeitos de luz verdes claros suaves no fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Espaço superior para equilíbrio */}
      <div className="w-full" />

      {/* Bloco Central: Lado a lado fixo e centralizado em telas grandes (lg+); Deslizamento fluido em telas menores (< lg) */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto flex items-center justify-center lg:justify-between lg:gap-20 xl:gap-28 min-h-[460px] px-2 sm:px-4">
        {/* Lado Esquerdo: Identidade do Sistema */}
        <div
          className={`w-full lg:w-auto text-center lg:text-left space-y-5 max-w-xl my-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto ${
            loginMobileAberto
              ? "absolute inset-x-0 -translate-x-full opacity-0 pointer-events-none"
              : "relative translate-x-0 opacity-100"
          }`}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
            Gestão de Refeitório{" "}
            <span className="text-emerald-700">IFPE</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-500 font-normal leading-relaxed max-w-lg mx-auto lg:mx-0">
            Sistema integrado de gestão alimentar e controle de refeições do campus.
          </p>

          {/* Lista vertical simples: centralizada na responsiva (< lg) e alinhada à esquerda no desktop (lg+) */}
          <div className="space-y-4 pt-3 w-fit mx-auto lg:mx-0 text-left">
            <div className="flex items-start gap-3">
              <Boxes className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Estoque e validade
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acompanhe o saldo de insumos por local e os alertas de vencimento.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Cardápio e transmissão nas TVs
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulte as refeições do dia exibidas nas TVs da Cozinha e do Refeitório.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  Consumo diário e relatórios
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registre os insumos utilizados por refeição e acompanhe os relatórios.
                </p>
              </div>
            </div>
          </div>

          {/* Botão "Ir para o login" mais espaçado para baixo em telas menores (< lg) */}
          <div className="pt-8 sm:pt-10 lg:hidden">
            <button
              id="btn-ir-para-login-mobile"
              type="button"
              onClick={() => setLoginMobileAberto(true)}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-full shadow-md shadow-emerald-900/10 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <span>Ir para o login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lado Direito: Card de Login (Centralizado com o conteúdo ao lado e com transição interna fluida) */}
        <div
          className={`w-full max-w-md my-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-900/5 p-8 sm:p-10 space-y-5 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0 lg:scale-100 lg:opacity-100 lg:pointer-events-auto ${
            loginMobileAberto
              ? "relative translate-x-0 scale-100 opacity-100"
              : "absolute translate-x-full scale-95 opacity-0 pointer-events-none"
          }`}
        >
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
              <p className="text-xs text-slate-400 mt-0.5 transition-opacity duration-300">
                {modoLogin === "google"
                  ? "Entre com sua conta Google"
                  : "Informe seu usuário e senha"}
              </p>
            </div>
          </div>

          {/* Feedback de Erro */}
          {erro && (
            <div
              role="alert"
              className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{erro}</span>
            </div>
          )}

          {/* Container com animação fluida de altura e deslizamento entre Google e Usuário/Senha */}
          <div className="relative">
            {/* Visão 1: Login com Google */}
            <div
              className={`grid transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                modoLogin === "google"
                  ? "grid-rows-[1fr] opacity-100 translate-x-0"
                  : "grid-rows-[0fr] opacity-0 -translate-x-6 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-5 pt-1">
                  {/* Botão de Login Google */}
                  <div className="flex flex-col items-center justify-center">
                    {processando && modoLogin === "google" ? (
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
                  </div>

                  {/* Separador "ou" */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-slate-200" />
                    <span className="bg-white px-3 text-xs text-slate-400 font-medium">
                      ou
                    </span>
                    <div className="w-full border-t border-slate-200" />
                  </div>

                  {/* Botão Entrar com usuário e senha */}
                  <div className="flex justify-center">
                    <button
                      id="btn-mostrar-login-local"
                      type="button"
                      onClick={abrirLoginCredenciais}
                      disabled={processando}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Entrar com usuário e senha</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Visão 2: Login com Usuário e Senha */}
            <div
              className={`grid transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                modoLogin === "credenciais"
                  ? "grid-rows-[1fr] opacity-100 translate-x-0"
                  : "grid-rows-[0fr] opacity-0 translate-x-6 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-5 pt-1">
                  <form
                    onSubmit={handleLoginCredenciais}
                    autoComplete="off"
                    className="space-y-4 px-0.5"
                  >
                    <div className="space-y-1.5">
                      <label
                        htmlFor="login-usuario"
                        className="block text-xs font-bold text-slate-700"
                      >
                        Usuário
                      </label>
                      <input
                        id="login-usuario"
                        name="usuario"
                        type="email"
                        required={modoLogin === "credenciais"}
                        tabIndex={modoLogin === "credenciais" ? 0 : -1}
                        autoComplete="username"
                        placeholder="Usuário"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={processando || modoLogin !== "credenciais"}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="login-senha"
                        className="block text-xs font-bold text-slate-700"
                      >
                        Senha
                      </label>
                      <input
                        key={senhaResetKey}
                        id="login-senha"
                        name="senha"
                        type="password"
                        required={modoLogin === "credenciais"}
                        tabIndex={modoLogin === "credenciais" ? 0 : -1}
                        autoComplete="new-password"
                        placeholder="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        disabled={processando || modoLogin !== "credenciais"}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>

                    <button
                      id="btn-entrar-credenciais"
                      type="submit"
                      tabIndex={modoLogin === "credenciais" ? 0 : -1}
                      disabled={processando || modoLogin !== "credenciais"}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {processando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Entrando...</span>
                        </>
                      ) : (
                        <span>Entrar</span>
                      )}
                    </button>
                  </form>

                  {/* Separador "ou" */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-slate-200" />
                    <span className="bg-white px-3 text-xs text-slate-400 font-medium">
                      ou
                    </span>
                    <div className="w-full border-t border-slate-200" />
                  </div>

                  {/* Link Voltar */}
                  <div className="flex justify-center">
                    <button
                      id="btn-voltar-login-google"
                      type="button"
                      tabIndex={modoLogin === "credenciais" ? 0 : -1}
                      onClick={voltarParaGoogle}
                      disabled={processando}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé com cadeado alinhado ao texto */}
      <footer className="relative z-10 w-full text-center py-2 space-y-1">
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          <Lock className="w-3.5 h-3.5 text-emerald-700 inline-block mr-1.5 -mt-0.5" />
          <span>
            O acesso é permitido somente a contas previamente autorizadas pelo Administrador.
          </span>
        </p>
        <p className="text-[11px] text-slate-400">
          Instituto Federal de Pernambuco — <span className="italic">Campus</span> Belo Jardim
        </p>
      </footer>
    </div>
  );
}
