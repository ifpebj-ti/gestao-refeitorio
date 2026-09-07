"use client";

import { useState } from "react";
import {
    Coffee,
    Sun,
    Moon,
    Edit3,
    Check,
    CheckCircle2,
} from "lucide-react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

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
        cafe: {
            pratoPrincipal: "Cuscuz nordestino com ovos mexidos",
            acompanhamentos: "Café puro, leite quente e manteiga",
            saladaSobremesa: "Banana prata",
        },
        almoco: {
            pratoPrincipal: "Frango guisado ao molho com batatas",
            acompanhamentos: "Arroz parboilizado, feijão carioca e macarrão espaguete",
            saladaSobremesa: "Salada de alface, tomate e cenoura ralada • Melancia",
        },
        jantar: {
            pratoPrincipal: "Sopa nutritiva de carne bovina com legumes e macarrão",
            acompanhamentos: "Torradas caseiras, café e leite",
            saladaSobremesa: "Maçã",
        },
    },
    Terça: {
        cafe: {
            pratoPrincipal: "Pão francês com queijo coalho na chapa",
            acompanhamentos: "Café com leite e achocolatado",
            saladaSobremesa: "Mamão fatiado",
        },
        almoco: {
            pratoPrincipal: "Carne bovina moída com legumes refogados",
            acompanhamentos: "Arroz branco, feijão macassar e farofa temperada",
            saladaSobremesa: "Salada de beterraba cozida e pepino • Laranja",
        },
        jantar: {
            pratoPrincipal: "Cuscuz temperado com carne de charque desfiada",
            acompanhamentos: "Café e leite quente",
            saladaSobremesa: "Banana da terra cozida",
        },
    },
    Quarta: {
        cafe: {
            pratoPrincipal: "Macaxeira cozida com manteiga de garrafa e ovos",
            acompanhamentos: "Café passado e leite quente",
            saladaSobremesa: "Melão fatiado",
        },
        almoco: {
            pratoPrincipal: "Coxa de frango assada com ervas",
            acompanhamentos: "Arroz, feijão carioca e purê de batata inglesa",
            saladaSobremesa: "Salada crua (repolho, tomate e pimentão) • Abacaxi",
        },
        jantar: {
            pratoPrincipal: "Mungunzá salgado com carne desfiada e milho",
            acompanhamentos: "Torradas temperadas e café",
            saladaSobremesa: "Tangerina",
        },
    },
    Quinta: {
        cafe: {
            pratoPrincipal: "Cuscuz de milho tradicional com queijo mussarela",
            acompanhamentos: "Café preto e leite",
            saladaSobremesa: "Banana prata",
        },
        almoco: {
            pratoPrincipal: "Iscas de carne bovina acebolada",
            acompanhamentos: "Arroz parboilizado, feijão macassar e macarrão ao alho e óleo",
            saladaSobremesa: "Salada de couve refogada e tomate • Manga",
        },
        jantar: {
            pratoPrincipal: "Canja de galinha caipira com arroz e cenoura",
            acompanhamentos: "Pão de forma tostado e café",
            saladaSobremesa: "Banana",
        },
    },
    Sexta: {
        cafe: {
            pratoPrincipal: "Batata doce cozida com ovos mexidos e queijo",
            acompanhamentos: "Café quente e leite integral",
            saladaSobremesa: "Mamão",
        },
        almoco: {
            pratoPrincipal: "Peito de frango em cubos ao molho suave de tomate",
            acompanhamentos: "Arroz colorido com legumes, feijão carioca e farofa de milho",
            saladaSobremesa: "Salada mista com azeitonas • Salada de frutas frescas",
        },
        jantar: {
            pratoPrincipal: "Sopa de feijão com macarrão e legumes",
            acompanhamentos: "Torradas e café com leite",
            saladaSobremesa: "Laranja",
        },
    },
};

export default function CardapioSemanalPage() {
    const router = useRouter();
    const { autenticado, carregando } = useAuth(); // <-- pegamos o carregando aqui

    const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("Segunda");
    const [cardapio, setCardapio] = useState<Record<DiaSemana, DiaCardapio>>(CARDAPIO_INICIAL);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [sucessoSalvo, setSucessoSalvo] = useState(false);

    // Só redireciona se JÁ TERMINOU de carregar o sessionStorage e mesmo assim NÃO está autenticado
    useEffect(() => {
        if (!carregando && !autenticado) {
            router.push("/login");
        }
    }, [autenticado, carregando, router]);

    // Enquanto estiver checando o storage ou se não estiver autenticado, não exibe nada
    if (carregando || !autenticado) {
        return null;
    }

    // ... resto do seu código normal continua daqui ...

    // 5. Resto do seu código normal continua daqui em diante:
    const diaAtualDados = cardapio[diaSelecionado];

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

    const salvarCardapio = () => {
        setSucessoSalvo(true);
        setModoEdicao(false);
        setTimeout(() => {
            setSucessoSalvo(false);
        }, 2500);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
            {/* 1. CABEÇALHO 100% IDÊNTICO AO RECEBIMENTO */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Cardápio Semanal
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Planejamento nutricional semanal • Alimenta as fichas de consumo da cozinha
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {modoEdicao ? (
                        <button
                            type="button"
                            onClick={salvarCardapio}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>Salvar Alterações</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setModoEdicao(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                        >
                            <Edit3 className="w-4 h-4 text-emerald-600" />
                            <span>Editar Cardápio</span>
                        </button>
                    )}
                </div>
            </div>

            {/* FEEDBACK DE SUCESSO */}
            {sucessoSalvo && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cardápio atualizado e sincronizado com o painel de consumo da equipe.</span>
                </div>
            )}

            {/* 2. SELETOR DOS DIAS DA SEMANA */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
                {DIAS_SEMANA.map((dia) => {
                    const isAtivo = diaSelecionado === dia;
                    return (
                        <button
                            key={dia}
                            type="button"
                            onClick={() => setDiaSelecionado(dia)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${isAtivo
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            {dia}-feira
                        </button>
                    );
                })}
            </div>

            {/* 3. CARDS DAS REFEIÇÕES DO DIA SELECIONADO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* CAFÉ DA MANHÃ */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
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

                        <div className="space-y-2.5">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Prato Principal
                                </label>
                                {modoEdicao ? (
                                    <textarea
                                        rows={2}
                                        value={diaAtualDados.cafe.pratoPrincipal}
                                        onChange={(e) => handleCampoChange("cafe", "pratoPrincipal", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                                        {diaAtualDados.cafe.pratoPrincipal}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Bebidas & Acompanhamentos
                                </label>
                                {modoEdicao ? (
                                    <textarea
                                        rows={2}
                                        value={diaAtualDados.cafe.acompanhamentos}
                                        onChange={(e) => handleCampoChange("cafe", "acompanhamentos", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {diaAtualDados.cafe.acompanhamentos}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Fruta / Complemento
                                </label>
                                {modoEdicao ? (
                                    <input
                                        type="text"
                                        value={diaAtualDados.cafe.saladaSobremesa}
                                        onChange={(e) => handleCampoChange("cafe", "saladaSobremesa", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {diaAtualDados.cafe.saladaSobremesa}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <span className="text-[10px] text-slate-400 pt-2 border-t border-slate-50">
                        Aporte calórico balanceado
                    </span>
                </div>

                {/* ALMOÇO */}
                <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between relative">
                    <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Refeição Principal
                    </span>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                                <Sun className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900">Almoço</h3>
                                <span className="text-[11px] text-slate-400 font-medium">11:30 às 13:30</span>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Proteína / Prato Base
                                </label>
                                {modoEdicao ? (
                                    <textarea
                                        rows={2}
                                        value={diaAtualDados.almoco.pratoPrincipal}
                                        onChange={(e) => handleCampoChange("almoco", "pratoPrincipal", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                                        {diaAtualDados.almoco.pratoPrincipal}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Guarnições & Acompanhamentos
                                </label>
                                {modoEdicao ? (
                                    <textarea
                                        rows={2}
                                        value={diaAtualDados.almoco.acompanhamentos}
                                        onChange={(e) => handleCampoChange("almoco", "acompanhamentos", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {diaAtualDados.almoco.acompanhamentos}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Saladas & Sobremesa
                                </label>
                                {modoEdicao ? (
                                    <input
                                        type="text"
                                        value={diaAtualDados.almoco.saladaSobremesa}
                                        onChange={(e) => handleCampoChange("almoco", "saladaSobremesa", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {diaAtualDados.almoco.saladaSobremesa}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <span className="text-[10px] text-emerald-800 font-medium pt-2 border-t border-slate-50">
                        Padrão PNAE atendido
                    </span>
                </div>

                {/* JANTAR */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
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

                        <div className="space-y-2.5">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Prato Principal
                                </label>
                                {modoEdicao ? (
                                    <textarea
                                        rows={2}
                                        value={diaAtualDados.jantar.pratoPrincipal}
                                        onChange={(e) => handleCampoChange("jantar", "pratoPrincipal", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                                        {diaAtualDados.jantar.pratoPrincipal}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Acompanhamentos
                                </label>
                                {modoEdicao ? (
                                    <textarea
                                        rows={2}
                                        value={diaAtualDados.jantar.acompanhamentos}
                                        onChange={(e) => handleCampoChange("jantar", "acompanhamentos", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {diaAtualDados.jantar.acompanhamentos}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Fruta / Sobremesa
                                </label>
                                {modoEdicao ? (
                                    <input
                                        type="text"
                                        value={diaAtualDados.jantar.saladaSobremesa}
                                        onChange={(e) => handleCampoChange("jantar", "saladaSobremesa", e.target.value)}
                                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                                    />
                                ) : (
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        {diaAtualDados.jantar.saladaSobremesa}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <span className="text-[10px] text-slate-400 pt-2 border-t border-slate-50">
                        Refeição noturna leve
                    </span>
                </div>
            </div>
        </div>
    );
}