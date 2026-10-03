"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Tv,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  SunMedium,
  Coffee,
  Moon,
  Eye,
} from "lucide-react";

type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
type TipoRefeicaoChave = "cafe" | "almoco" | "jantar";

const DIAS_SEMANA: DiaSemana[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const STORAGE_KEY = "@gestao_refeitorio:cardapio_semanal";
const KEY_REFEICAO_TV = "@gestao_refeitorio:refeicao_ativa_tv";

const DIAS_NOMES: Record<number, DiaSemana> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
};

interface RefeicaoCardapio {
  pratoPrincipal: string;
  acompanhamentos?: string;
  saladaSobremesa?: string;
  insumosPlanejados?: Array<{ nome: string; quantidadeTotal: number; unidadeMedida: string }>;
}

interface DiaCardapio {
  cafe: RefeicaoCardapio;
  almoco: RefeicaoCardapio;
  jantar: RefeicaoCardapio;
}

const CARDAPIO_PADRAO: Record<DiaSemana, DiaCardapio> = {
  Segunda: {
    cafe: { pratoPrincipal: "CUSCUZ COM OVOS MEXIDOS, CAFÉ COM LEITE E BANANA." },
    almoco: {
      pratoPrincipal:
        "BISTECA SUÍNA ASSADA E CALABRESA (PODE SE SERVIR DAS DUAS OPÇÕES), ARROZ, FEIJÃO PRETO, PURÊ DE MACAXEIRA, BATATA DOCE GRATINADA, MACAXEIRA GRATINADA, OVO COZIDO E FAROFA. SALADA: BETERRABA COZIDA, PEPINO, TOMATE E AZEITONA. SOBREMESA: GOIABA",
    },
    jantar: { pratoPrincipal: "SOPA NUTRITIVA DE LEGUMES COM CARNE DESFIADA E TORRADAS." },
  },
  Terça: {
    cafe: { pratoPrincipal: "PÃO COM QUEIJO COALHO E MANTEIGA, CAFÉ COM LEITE E MAÇÃ." },
    almoco: {
      pratoPrincipal:
        "FRANGO ASSADO AO FORNO COM ERVAS, ARROZ BRANCO, FEIJÃO CARIOCA, MACARRÃO AO ALHO E ÓLEO, VINAGRETE. SOBREMESA: MELANCIA",
    },
    jantar: { pratoPrincipal: "CUSCUZ TEMPERADO COM CARNE DE SOL DESFIADA E CAFÉ." },
  },
  Quarta: {
    cafe: { pratoPrincipal: "VITAMINA DE FRUTAS COM AVEIA E TORRADA INTEGRAL COM REQUEIJÃO." },
    almoco: {
      pratoPrincipal:
        "CARNE BOVINA DE PANELA COM MANDIOCA, ARROZ PARBOILIZADO, FEIJÃO CARIOCA, SALADA VERDE (ALFACE, TOMATE E CEBOLA). SOBREMESA: LARANJA",
    },
    jantar: { pratoPrincipal: "MACARRONADA COM MOLHO À BOLONHESA E QUEIJO RALADO." },
  },
  Quinta: {
    cafe: { pratoPrincipal: "INHAME COZIDO COM OVOS E MANTEIGA DA TERRA, CAFÉ COM LEITE." },
    almoco: {
      pratoPrincipal:
        "FEIJOADA COMPLETA TRADICIONAL, ARROZ BRANCO, COUVE REFOGADA, FAROFA DA CASA, LARANJA EM FATIAS.",
    },
    jantar: { pratoPrincipal: "MUNGUNZÁ SALGADO COM CARNE DESFIADA E QUEIJO." },
  },
  Sexta: {
    cafe: { pratoPrincipal: "BOLO CASEIRO DE MILHO, CAFÉ COM LEITE E MAÇÃ." },
    almoco: {
      pratoPrincipal:
        "PEIXE EMPANADO OU ISCAS DE FRANGO GRELHADO, ARROZ COM CENOURA, FEIJÃO MACASSAR, PURÊ DE BATATA, SALADA TROPICAL. SOBREMESA: ABACAXI",
    },
    jantar: { pratoPrincipal: "SANDUÍCHE NATURAL DE FRANGO DESFIADO COM SUCO DE MARACUJÁ." },
  },
};

const toLocalDateInputString = (d: Date) => {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

function getSegundaDaSemana(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Domingo, 1 = Segunda ... 6 = Sábado
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const segunda = new Date(date.setDate(diff));
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

function calcularDadosDia(segunda: Date, offsetDias: number) {
  const d = new Date(segunda);
  d.setDate(segunda.getDate() + offsetDias);
  const hoje = new Date();
  const isHoje =
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear();

  const diaStr = String(d.getDate()).padStart(2, "0");
  const mesStr = String(d.getMonth() + 1).padStart(2, "0");

  return {
    data: d,
    dataFormatada: `${diaStr}/${mesStr}`,
    isHoje,
  };
}

export default function CardapioTvPage() {
  const { usuario } = useAuth();
  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("Segunda");
  const [cardapio, setCardapio] = useState<Record<DiaSemana, DiaCardapio>>(CARDAPIO_PADRAO);
  const [cardapioOriginalJson, setCardapioOriginalJson] = useState<string>("");
  const [refeicaoTransmitida, setRefeicaoTransmitida] = useState<TipoRefeicaoChave>("almoco");
  const [feedbackSalvo, setFeedbackSalvo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [urlTv, setUrlTv] = useState("/tv");

  // Inicialização e acompanhamento do dia atual
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrlTv(`${window.location.origin}/tv`);
    }

    const agora = new Date();
    setDataReferencia(agora);
    const diaNum = agora.getDay();
    if (DIAS_NOMES[diaNum]) {
      setDiaSelecionado(DIAS_NOMES[diaNum]);
    } else {
      setDiaSelecionado("Segunda");
    }

    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        setCardapio(parsed);
        setCardapioOriginalJson(JSON.stringify(parsed));
      } else {
        setCardapioOriginalJson(JSON.stringify(CARDAPIO_PADRAO));
      }

      const ativaSalva = localStorage.getItem(KEY_REFEICAO_TV) as TipoRefeicaoChave | null;
      if (ativaSalva && ["cafe", "almoco", "jantar"].includes(ativaSalva)) {
        setRefeicaoTransmitida(ativaSalva);
      }
    } catch (e) {
      console.error("Erro ao ler configurações da TV:", e);
    }
  }, []);

  // Datas calculadas da semana com base na data de referência
  const segundaSemana = getSegundaDaSemana(dataReferencia);
  const datasSemana: Record<DiaSemana, { data: Date; dataFormatada: string; isHoje: boolean }> = {
    Segunda: calcularDadosDia(segundaSemana, 0),
    Terça: calcularDadosDia(segundaSemana, 1),
    Quarta: calcularDadosDia(segundaSemana, 2),
    Quinta: calcularDadosDia(segundaSemana, 3),
    Sexta: calcularDadosDia(segundaSemana, 4),
  };

  const handleMudarData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [ano, mes, dia] = val.split("-").map(Number);
    const novaData = new Date(ano, mes - 1, dia, 12, 0, 0);
    setDataReferencia(novaData);
    const diaNum = novaData.getDay();
    if (DIAS_NOMES[diaNum]) {
      setDiaSelecionado(DIAS_NOMES[diaNum]);
    }
  };

  const irParaHoje = () => {
    const agora = new Date();
    setDataReferencia(agora);
    const diaNum = agora.getDay();
    if (DIAS_NOMES[diaNum]) {
      setDiaSelecionado(DIAS_NOMES[diaNum]);
    } else {
      setDiaSelecionado("Segunda");
    }
  };

  const handleSelecionarDia = (dia: DiaSemana) => {
    setDiaSelecionado(dia);
    const info = datasSemana[dia];
    if (info) {
      setDataReferencia(new Date(info.data));
    }
  };

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlTv);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const handleTrocarRefeicaoTransmitida = (refeicao: TipoRefeicaoChave) => {
    setRefeicaoTransmitida(refeicao);
    try {
      localStorage.setItem(KEY_REFEICAO_TV, refeicao);
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Erro ao salvar refeição ativa da TV:", e);
    }
  };

  const handleTextoChange = (refeicao: TipoRefeicaoChave, valor: string) => {
    setCardapio((prev) => ({
      ...prev,
      [diaSelecionado]: {
        ...prev[diaSelecionado],
        [refeicao]: {
          ...prev[diaSelecionado][refeicao],
          pratoPrincipal: valor,
        },
      },
    }));
  };

  // Identifica se houve alguma modificação real nos textos do cardápio
  const cardapioAtualJson = JSON.stringify(cardapio);
  const temAlteracoesPendentes = Boolean(
    cardapioOriginalJson && cardapioAtualJson !== cardapioOriginalJson
  );

  const handleSalvar = () => {
    if (!temAlteracoesPendentes) return;

    try {
      localStorage.setItem(STORAGE_KEY, cardapioAtualJson);
      setCardapioOriginalJson(cardapioAtualJson);
      localStorage.setItem(KEY_REFEICAO_TV, refeicaoTransmitida);
      if (usuario?.nome) {
        localStorage.setItem(
          "@gestao_refeitorio:cardapio_nutricionista",
          `Nutricionista ${usuario.nome}`
        );
      }
      window.dispatchEvent(new Event("storage"));
      setFeedbackSalvo(true);
      setTimeout(() => setFeedbackSalvo(false), 3500);
    } catch (e) {
      console.error("Erro ao salvar cardápio da TV:", e);
    }
  };

  const dadosDia = cardapio[diaSelecionado];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-24">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cardápio na TV (Mural dos Estudantes)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Configure o texto descritivo e escolha a refeição exibida no monitor do refeitório.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSalvar}
          disabled={!temAlteracoesPendentes}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all self-start sm:self-auto ${
            temAlteracoesPendentes
              ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md cursor-pointer"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
          }`}
          title={
            temAlteracoesPendentes
              ? "Salvar alterações feitas no cardápio"
              : "Nenhuma alteração realizada para salvar"
          }
        >
          <Check className="w-4 h-4" />
          <span>Salvar</span>
          {temAlteracoesPendentes && (
            <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
          )}
        </button>
      </div>

      {/* FEEDBACK DE SALVO */}
      {feedbackSalvo && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">Cardápio da TV salvo com sucesso!</p>
            <p className="text-xs text-emerald-100 mt-0.5">
              O monitor do refeitório atualizará a exibição automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* 2. CARD DO LINK PÚBLICO PARA A TELEVISÃO (SOMENTE COPIAR LINK) */}
      <div className="bg-emerald-600 text-white p-5 sm:p-6 rounded-2xl shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-white">
                Link de Visualização para a Televisão do Refeitório
              </h2>
              <p className="text-xs text-emerald-50 mt-0.5">
                Copie este link e coloque no navegador da TV do refeitório. Ele abre em tela cheia com alta legibilidade.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopiarLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? "Link Copiado!" : "Copiar Link"}</span>
          </button>
        </div>

        {/* Input Read-only com a URL */}
        <div className="bg-emerald-700/70 border border-emerald-500/60 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono text-emerald-50 flex items-center justify-between">
          <span className="truncate">{urlTv}</span>
          <span className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-0.5 rounded-md shrink-0 ml-2">
            Modo Somente Leitura
          </span>
        </div>
      </div>

      {/* 3. SELETOR DE DATA REAL & DIAS DA SEMANA */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Data de Referência:</span>
            <input
              type="date"
              value={toLocalDateInputString(dataReferencia)}
              onChange={handleMudarData}
              className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={irParaHoje}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer self-start sm:self-auto border border-slate-200"
            title="Ir para o dia atual"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hoje</span>
          </button>
        </div>

        {/* Botões dos dias da semana com datas reais */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DIAS_SEMANA.map((dia) => {
            const ativo = diaSelecionado === dia;
            const info = datasSemana[dia];
            return (
              <button
                key={dia}
                type="button"
                onClick={() => handleSelecionarDia(dia)}
                className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border text-center flex flex-col items-center justify-center gap-0.5 ${
                  ativo
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold">{dia}</span>
                  {info?.isHoje && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                        ativo ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      Hoje
                    </span>
                  )}
                </div>
                {info && (
                  <span
                    className={`text-[11px] font-medium ${
                      ativo ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    {info.dataFormatada}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SEÇÕES DAS REFEIÇÕES PARA A TV */}
      <div className="space-y-6">
        {/* Almoço */}
        <CardEdicaoTvRefeicao
          titulo="Almoço"
          horario="11:30 às 13:30"
          Icone={SunMedium}
          corIcone="text-emerald-700 bg-emerald-50 border-emerald-200"
          valor={dadosDia.almoco?.pratoPrincipal || ""}
          estaTransmitindo={refeicaoTransmitida === "almoco"}
          onTransmitir={() => handleTrocarRefeicaoTransmitida("almoco")}
          onChange={(v) => handleTextoChange("almoco", v)}
        />

        {/* Café da Manhã */}
        <CardEdicaoTvRefeicao
          titulo="Café da Manhã"
          horario="07:00 às 08:30"
          Icone={Coffee}
          corIcone="text-amber-700 bg-amber-50 border-amber-200"
          valor={dadosDia.cafe?.pratoPrincipal || ""}
          estaTransmitindo={refeicaoTransmitida === "cafe"}
          onTransmitir={() => handleTrocarRefeicaoTransmitida("cafe")}
          onChange={(v) => handleTextoChange("cafe", v)}
        />

        {/* Jantar */}
        <CardEdicaoTvRefeicao
          titulo="Jantar"
          horario="17:30 às 19:00"
          Icone={Moon}
          corIcone="text-indigo-700 bg-indigo-50 border-indigo-200"
          valor={dadosDia.jantar?.pratoPrincipal || ""}
          estaTransmitindo={refeicaoTransmitida === "jantar"}
          onTransmitir={() => handleTrocarRefeicaoTransmitida("jantar")}
          onChange={(v) => handleTextoChange("jantar", v)}
        />
      </div>
    </div>
  );
}

function CardEdicaoTvRefeicao({
  titulo,
  horario,
  Icone,
  corIcone,
  valor,
  estaTransmitindo,
  onTransmitir,
  onChange,
}: {
  titulo: string;
  horario: string;
  Icone: typeof Coffee;
  corIcone: string;
  valor: string;
  estaTransmitindo: boolean;
  onTransmitir: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
        estaTransmitindo ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${corIcone}`}>
            <Icone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{titulo}</h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {horario}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Texto que será exibido em letras grandes na TV para os estudantes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Botão Transmitir com status */}
          {estaTransmitindo ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Transmitindo
            </span>
          ) : (
            <button
              type="button"
              onClick={onTransmitir}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title={`Transmitir ${titulo} na TV do refeitório agora`}
            >
              <Tv className="w-3.5 h-3.5 text-slate-500" />
              <span>Transmitir</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          rows={3}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Ex: BISTECA SUÍNA ASSADA E CALABRESA, ARROZ, FEIJÃO PRETO, MACAXEIRA... SALADA: BETERRABA E TOMATE. SOBREMESA: GOIABA`}
          className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 transition-colors leading-relaxed shadow-2xs placeholder:text-slate-400 placeholder:font-normal uppercase"
        />

        {/* Pré-visualização da TV em miniatura */}
        {valor && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prévia da TV:</span>
            </div>
            <p className="text-xs font-normal text-slate-800 leading-snug uppercase">
              {valor}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

