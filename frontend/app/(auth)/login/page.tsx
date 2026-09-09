"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lock, Delete, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { validarPin } = useAuth();
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);

  const handleDigito = useCallback((digito: string) => {
    setErro(false);
    setPin((prev) => (prev.length < 4 ? prev + digito : prev));
  }, []);

  const handleApagar = useCallback(() => {
    setErro(false);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Validação automática ao atingir 4 dígitos -> Redireciona para /consumo
  useEffect(() => {
    if (pin.length === 4) {
      const sucesso = validarPin(pin);
      if (sucesso) {
        router.push("/consumo");
      } else {
        setErro(true);
        setTimeout(() => {
          setPin("");
        }, 500);
      }
    }
  }, [pin, validarPin, router]);

  // Suporte a digitação no teclado físico
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") {
        handleDigito(e.key);
      } else if (e.key === "Backspace") {
        handleApagar();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigito, handleApagar]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-sm w-full p-6 sm:p-8 space-y-6">
        {/* Voltar para a Cozinha */}
        <Link
          href="/consumo"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Terminal da Cozinha</span>
        </Link>

        {/* Cabeçalho */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Área do Nutricionista
          </h1>
          <p className="text-xs text-slate-500">
            Digite seu PIN de 4 dígitos para acessar a gestão técnica (PIN: 1234)
          </p>
        </div>

        {/* Indicadores dos 4 dígitos */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((index) => {
            const preenchido = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  erro
                    ? "border-rose-500 bg-rose-500 animate-pulse"
                    : preenchido
                    ? "border-emerald-600 bg-emerald-600 scale-110"
                    : "border-slate-300 bg-slate-100"
                }`}
              />
            );
          })}
        </div>

        {erro && (
          <p className="text-center text-xs font-bold text-rose-600">
            PIN incorreto. Tente novamente.
          </p>
        )}

        {/* Teclado Numérico Touch */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigito(num)}
              className="h-14 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-xl font-bold rounded-2xl border border-slate-200/80 transition-colors cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPin("")}
            className="h-14 text-xs font-semibold text-slate-400 hover:text-slate-600 rounded-2xl cursor-pointer"
          >
            Limpar
          </button>

          <button
            type="button"
            onClick={() => handleDigito("0")}
            className="h-14 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-xl font-bold rounded-2xl border border-slate-200/80 transition-colors cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleApagar}
            className="h-14 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-2xl border border-slate-200/80 transition-colors cursor-pointer"
            title="Apagar"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}