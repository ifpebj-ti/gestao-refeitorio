"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Coffee,
  SunMedium,
  Moon,
  Edit3,
  Check,
  CheckCircle2,
  Calendar,
} from "lucide-react";

type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";

interface RefeicaoCardapio {
  pratoPrincipal: string;
  acompanhamentos: string;
  saladaSobremesa: string;
}

interface DiaCardapio {
  cafe: RefeicaoCardapio;
  almoco: RefeicaoCardapio;
  jantar: RefeicaoCardapio;
}

const DIAS_SEMANA: DiaSemana[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

const CARDAPIO_INICIAL: Record<DiaSemana, DiaCardapio> = {
  Segunda: {
    cafe: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    almoco: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    jantar: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
  },
  Terça: {
    cafe: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    almoco: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    jantar: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
  },
  Quarta: {
    cafe: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    almoco: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    jantar: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
  },
  Quinta: {
    cafe: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    almoco: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    jantar: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
  },
  Sexta: {
    cafe: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    almoco: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
    jantar: { pratoPrincipal: "", acompanhamentos: "", saladaSobremesa: "" },
  },
};

const STORAGE_KEY = "@gestao_refeitorio:cardapio_semanal";

export default function CardapioSemanalPage() {
  const { perfil } = useAuth();
  const isNutricionista = perfil === "NUTRICIONISTA";

  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("Segunda");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cardapio, setCardapio] = useState<Record<DiaSemana, DiaCardapio>>(CARDAPIO_INICIAL);
  const [feedbackSalvo, setFeedbackSalvo] = useState(false);

  // Carrega cardápio salvo no localStorage
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        setCardapio(JSON.parse(salvo));
      }
    } catch (e) {
      console.error("Erro ao carregar cardápio salvo:", e);
    }
  }, []);

  const handleCampoChange = (
    refeicao: "cafe" | "almoco" | "jantar",
    campo: keyof RefeicaoCardapio,
    valor: string
  ) => {
    setCardapio((prev) => ({
      ...prev,
      [diaSelecionado]: {
        ...prev[diaSelecionado],
        [refeicao]: {
          ...prev[diaSelecionado][refeicao],
          [campo]: valor,
        },
      },
    }));
  };

  const handleSalvarCardapio = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cardapio));
      setFeedbackSalvo(true);
      setModoEdicao(false);
      setTimeout(() => setFeedbackSalvo(false), 3500);
    } catch (e) {
      console.error("Erro ao salvar cardápio:", e);
    }
  };

  const diaAtualDados = cardapio[diaSelecionado];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Cardápio Semanal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Planejamento nutricional e gestão das refeições para os dias letivos.
              </p>
            </div>
          </div>
        </div>

        {/* Ação de Edição / Salvamento */}
        {isNutricionista && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {modoEdicao ? (
              <button
                type="button"
                onClick={handleSalvarCardapio}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModoEdicao(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Cardápio</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feedback de salvamento */}
      {feedbackSalvo && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm">Cardápio salvo com sucesso!</p>
            <p className="text-xs text-emerald-100">
              As alterações do planejamento foram salvas e atualizadas no mural do refeitório.
            </p>
          </div>
        </div>
      )}

      {/* Seletor dos Dias da Semana */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DIAS_SEMANA.map((dia) => {
          const ativo = diaSelecionado === dia;
          return (
            <button
              key={dia}
              type="button"
              onClick={() => setDiaSelecionado(dia)}
              className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border text-center ${
                ativo
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <span>{dia}</span>
            </button>
          );
        })}
      </div>

      {/* Cards das 3 Refeições do Dia Selecionado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* 1. CAFÉ DA MANHÃ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Café da Manhã</h3>
                <span className="text-[11px] text-slate-400 font-medium">07:00 às 08:30</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Prato Principal
                </label>
                {modoEdicao ? (
                  <textarea
                    rows={2}
                    placeholder="Ex.: Cuscuz nordestino com ovos mexidos..."
                    value={diaAtualDados.cafe.pratoPrincipal}
                    onChange={(e) => handleCampoChange("cafe", "pratoPrincipal", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.cafe.pratoPrincipal?.trim() ? (
                  <p className="text-xs font-bold text-slate-800 mt-0.5 leading-relaxed">
                    {diaAtualDados.cafe.pratoPrincipal}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Acompanhamentos
                </label>
                {modoEdicao ? (
                  <textarea
                    rows={2}
                    placeholder="Ex.: Café com leite quente, pão com manteiga..."
                    value={diaAtualDados.cafe.acompanhamentos}
                    onChange={(e) => handleCampoChange("cafe", "acompanhamentos", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.cafe.acompanhamentos?.trim() ? (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {diaAtualDados.cafe.acompanhamentos}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Fruta / Bebida
                </label>
                {modoEdicao ? (
                  <input
                    type="text"
                    placeholder="Ex.: Banana prata fatiada..."
                    value={diaAtualDados.cafe.saladaSobremesa}
                    onChange={(e) => handleCampoChange("cafe", "saladaSobremesa", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.cafe.saladaSobremesa?.trim() ? (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {diaAtualDados.cafe.saladaSobremesa}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 pt-2 border-t border-slate-50">
            Padrão matinal
          </span>
        </div>

        {/* 2. ALMOÇO */}
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 bg-gradient-to-b from-emerald-50/20 to-white">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <SunMedium className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Almoço</h3>
                <span className="text-[11px] text-emerald-800 font-bold">11:30 às 13:30</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Proteína / Prato Principal
                </label>
                {modoEdicao ? (
                  <textarea
                    rows={2}
                    placeholder="Ex.: Frango ao molho / Carne bovina moída com legumes..."
                    value={diaAtualDados.almoco.pratoPrincipal}
                    onChange={(e) => handleCampoChange("almoco", "pratoPrincipal", e.target.value)}
                    className="w-full mt-1 p-2 border border-emerald-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.almoco.pratoPrincipal?.trim() ? (
                  <p className="text-xs font-bold text-slate-900 mt-0.5 leading-relaxed">
                    {diaAtualDados.almoco.pratoPrincipal}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Guarnições & Acompanhamentos
                </label>
                {modoEdicao ? (
                  <textarea
                    rows={2}
                    placeholder="Ex.: Arroz parboilizado, feijão carioca e macarrão..."
                    value={diaAtualDados.almoco.acompanhamentos}
                    onChange={(e) => handleCampoChange("almoco", "acompanhamentos", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.almoco.acompanhamentos?.trim() ? (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {diaAtualDados.almoco.acompanhamentos}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Saladas & Sobremesa
                </label>
                {modoEdicao ? (
                  <input
                    type="text"
                    placeholder="Ex.: Salada crua (tomate e repolho) • Melancia..."
                    value={diaAtualDados.almoco.saladaSobremesa}
                    onChange={(e) => handleCampoChange("almoco", "saladaSobremesa", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.almoco.saladaSobremesa?.trim() ? (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {diaAtualDados.almoco.saladaSobremesa}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>
            </div>
          </div>

          <span className="text-[10px] text-emerald-800 font-bold pt-2 border-t border-emerald-100/60">
            Padrão PNAE atendido
          </span>
        </div>

        {/* 3. JANTAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Jantar</h3>
                <span className="text-[11px] text-slate-400 font-medium">17:30 às 19:00</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Prato Principal
                </label>
                {modoEdicao ? (
                  <textarea
                    rows={2}
                    placeholder="Ex.: Sopa nutritiva de carne / Cuscuz temperado..."
                    value={diaAtualDados.jantar.pratoPrincipal}
                    onChange={(e) => handleCampoChange("jantar", "pratoPrincipal", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.jantar.pratoPrincipal?.trim() ? (
                  <p className="text-xs font-bold text-slate-800 mt-0.5 leading-relaxed">
                    {diaAtualDados.jantar.pratoPrincipal}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Acompanhamentos
                </label>
                {modoEdicao ? (
                  <textarea
                    rows={2}
                    placeholder="Ex.: Torradas caseiras, café e leite quente..."
                    value={diaAtualDados.jantar.acompanhamentos}
                    onChange={(e) => handleCampoChange("jantar", "acompanhamentos", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.jantar.acompanhamentos?.trim() ? (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {diaAtualDados.jantar.acompanhamentos}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Fruta / Sobremesa
                </label>
                {modoEdicao ? (
                  <input
                    type="text"
                    placeholder="Ex.: Maçã / Banana da terra cozida..."
                    value={diaAtualDados.jantar.saladaSobremesa}
                    onChange={(e) => handleCampoChange("jantar", "saladaSobremesa", e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                ) : diaAtualDados.jantar.saladaSobremesa?.trim() ? (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {diaAtualDados.jantar.saladaSobremesa}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-0.5">Não preenchido</p>
                )}
              </div>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 pt-2 border-t border-slate-50">
            Refeição noturna
          </span>
        </div>
      </div>
    </div>
  );
}
