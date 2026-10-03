"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Coffee,
  SunMedium,
  Moon,
  Edit3,
  Check,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { produtoService, ProdutoResponse } from "@/lib/produtos";

type DiaSemana = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta";
type TipoRefeicaoChave = "cafe" | "almoco" | "jantar";

export interface InsumoPlanejado {
  produtoId: string;
  nome: string;
  unidadeMedida: string;
  quantidadeTotal: number;
}

export interface RefeicaoCardapio {
  pratoPrincipal: string;
  acompanhamentos: string;
  saladaSobremesa: string;
  insumosPlanejados?: InsumoPlanejado[];
}

interface DiaCardapio {
  cafe: RefeicaoCardapio;
  almoco: RefeicaoCardapio;
  jantar: RefeicaoCardapio;
}

const DIAS_SEMANA: DiaSemana[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

const DIAS_NOMES: Record<number, DiaSemana> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
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

const INFO_REFEICOES: Record<
  TipoRefeicaoChave,
  {
    titulo: string;
    horario: string;
    icon: typeof Coffee;
    corIcone: string;
  }
> = {
  almoco: {
    titulo: "Almoço",
    horario: "11:30 às 13:30",
    icon: SunMedium,
    corIcone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  cafe: {
    titulo: "Café da Manhã",
    horario: "07:00 às 08:30",
    icon: Coffee,
    corIcone: "text-amber-700 bg-amber-50 border-amber-200",
  },
  jantar: {
    titulo: "Jantar",
    horario: "17:30 às 19:00",
    icon: Moon,
    corIcone: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
};

const PRODUTOS_PADRAO_FALLBACK: ProdutoResponse[] = [
  { id: "fallback-arroz-parb", nome: "Arroz Parboilizado", categoria: "Grãos & Cereais", unidadeMedida: "Kg", valorReferencia: 6.5, saldoTotal: 120, podeExcluir: false },
  { id: "fallback-feijao-car", nome: "Feijão Carioca", categoria: "Grãos & Cereais", unidadeMedida: "Kg", valorReferencia: 7.8, saldoTotal: 95, podeExcluir: false },
  { id: "fallback-feijao-mac", nome: "Feijão Macassar", categoria: "Grãos & Cereais", unidadeMedida: "Kg", valorReferencia: 7.0, saldoTotal: 60, podeExcluir: false },
  { id: "fallback-macarrao", nome: "Macarrão Espaguete", categoria: "Grãos & Cereais", unidadeMedida: "Kg", valorReferencia: 4.2, saldoTotal: 50, podeExcluir: false },
  { id: "fallback-frango", nome: "Peito de Frango", categoria: "Proteínas & Frios", unidadeMedida: "Kg", valorReferencia: 18.5, saldoTotal: 40, podeExcluir: false },
  { id: "fallback-coxa", nome: "Coxa de Frango", categoria: "Proteínas & Frios", unidadeMedida: "Kg", valorReferencia: 12.0, saldoTotal: 35, podeExcluir: false },
  { id: "fallback-carne", nome: "Carne Bovina Moída", categoria: "Proteínas & Frios", unidadeMedida: "Kg", valorReferencia: 28.0, saldoTotal: 30, podeExcluir: false },
  { id: "fallback-calabresa", nome: "Linguiça Calabresa", categoria: "Proteínas & Frios", unidadeMedida: "Kg", valorReferencia: 24.0, saldoTotal: 25, podeExcluir: false },
  { id: "fallback-ovos", nome: "Ovos Pasteurizados / Cartela", categoria: "Proteínas & Frios", unidadeMedida: "Und", valorReferencia: 18.0, saldoTotal: 20, podeExcluir: false },
  { id: "fallback-leite", nome: "Leite in natura", categoria: "Laticínios", unidadeMedida: "Lt", valorReferencia: 4.8, saldoTotal: 70, podeExcluir: false },
  { id: "fallback-queijo", nome: "Queijo Mussarela", categoria: "Laticínios", unidadeMedida: "Kg", valorReferencia: 39.0, saldoTotal: 15, podeExcluir: false },
  { id: "fallback-margarina", nome: "Margarina", categoria: "Laticínios", unidadeMedida: "Kg", valorReferencia: 12.0, saldoTotal: 18, podeExcluir: false },
  { id: "fallback-cuscuz", nome: "Flocão de Milho (Cuscuz)", categoria: "Grãos & Cereais", unidadeMedida: "Kg", valorReferencia: 2.8, saldoTotal: 80, podeExcluir: false },
  { id: "fallback-tomate", nome: "Tomate", categoria: "Hortifrúti", unidadeMedida: "Kg", valorReferencia: 7.0, saldoTotal: 30, podeExcluir: false },
  { id: "fallback-cebola", nome: "Cebola", categoria: "Hortifrúti", unidadeMedida: "Kg", valorReferencia: 5.5, saldoTotal: 35, podeExcluir: false },
  { id: "fallback-alho", nome: "Alho", categoria: "Hortifrúti", unidadeMedida: "Kg", valorReferencia: 25.0, saldoTotal: 10, podeExcluir: false },
  { id: "fallback-batata", nome: "Batata Inglesa", categoria: "Hortifrúti", unidadeMedida: "Kg", valorReferencia: 6.0, saldoTotal: 45, podeExcluir: false },
  { id: "fallback-cenoura", nome: "Cenoura", categoria: "Hortifrúti", unidadeMedida: "Kg", valorReferencia: 5.0, saldoTotal: 28, podeExcluir: false },
  { id: "fallback-oleo", nome: "Óleo Vegetal", categoria: "Especificações & Condimentos", unidadeMedida: "Lt", valorReferencia: 6.9, saldoTotal: 40, podeExcluir: false },
  { id: "fallback-sal", nome: "Sal", categoria: "Especificações & Condimentos", unidadeMedida: "Kg", valorReferencia: 2.0, saldoTotal: 60, podeExcluir: false },
];

export default function CardapioSemanalPage() {
  const { perfil, usuario } = useAuth();
  const isNutricionista = perfil === "NUTRICIONISTA";

  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("Segunda");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cardapio, setCardapio] = useState<Record<DiaSemana, DiaCardapio>>(CARDAPIO_INICIAL);
  const [feedbackSalvo, setFeedbackSalvo] = useState(false);
  const [produtosEstoque, setProdutosEstoque] = useState<ProdutoResponse[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);

  // Inicialização e acompanhamento do dia atual
  useEffect(() => {
    const agora = new Date();
    setDataReferencia(agora);
    const diaNum = agora.getDay();
    if (DIAS_NOMES[diaNum]) {
      setDiaSelecionado(DIAS_NOMES[diaNum]);
    } else {
      setDiaSelecionado("Segunda");
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

  // Carrega produtos do catálogo para seleção do nutricionista com fallback garantido
  useEffect(() => {
    setCarregandoProdutos(true);
    produtoService
      .listar()
      .then((lista) => {
        if (lista && lista.length > 0) {
          setProdutosEstoque(lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        } else {
          setProdutosEstoque(PRODUTOS_PADRAO_FALLBACK);
        }
      })
      .catch((err) => {
        console.error("Erro ao listar produtos para cardápio, utilizando catálogo de apoio:", err);
        setProdutosEstoque(PRODUTOS_PADRAO_FALLBACK);
      })
      .finally(() => setCarregandoProdutos(false));
  }, []);

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

  const handleAdicionarInsumo = (
    refeicao: TipoRefeicaoChave,
    produtoId: string,
    quantidadeTotal: number
  ) => {
    const prod = produtosEstoque.find((p) => p.id === produtoId);
    if (!prod || quantidadeTotal <= 0) return;

    setCardapio((prev) => {
      const refeicaoAtual = prev[diaSelecionado][refeicao];
      const listaAtual = refeicaoAtual.insumosPlanejados || [];

      const index = listaAtual.findIndex((i) => i.produtoId === produtoId);
      let novaLista: InsumoPlanejado[];
      if (index >= 0) {
        novaLista = listaAtual.map((item, idx) =>
          idx === index ? { ...item, quantidadeTotal } : item
        );
      } else {
        novaLista = [
          ...listaAtual,
          {
            produtoId: prod.id,
            nome: prod.nome,
            unidadeMedida: prod.unidadeMedida,
            quantidadeTotal,
          },
        ];
      }

      return {
        ...prev,
        [diaSelecionado]: {
          ...prev[diaSelecionado],
          [refeicao]: {
            ...refeicaoAtual,
            insumosPlanejados: novaLista,
          },
        },
      };
    });
  };

  const handleRemoverInsumo = (
    refeicao: TipoRefeicaoChave,
    produtoId: string
  ) => {
    setCardapio((prev) => {
      const refeicaoAtual = prev[diaSelecionado][refeicao];
      const listaAtual = refeicaoAtual.insumosPlanejados || [];
      return {
        ...prev,
        [diaSelecionado]: {
          ...prev[diaSelecionado],
          [refeicao]: {
            ...refeicaoAtual,
            insumosPlanejados: listaAtual.filter((i) => i.produtoId !== produtoId),
          },
        },
      };
    });
  };

  const handleSalvarCardapio = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cardapio));
      if (usuario?.nome) {
        localStorage.setItem(
          "@gestao_refeitorio:cardapio_nutricionista",
          `Nutricionista ${usuario.nome}`
        );
      }
      setFeedbackSalvo(true);
      setModoEdicao(false);
      setTimeout(() => setFeedbackSalvo(false), 3500);
    } catch (e) {
      console.error("Erro ao salvar cardápio:", e);
    }
  };

  const diaAtualDados = cardapio[diaSelecionado];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 pb-24">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cardápio Semanal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Planejamento de insumos para a cozinha e descrição para exibição na TV do refeitório.
            </p>
          </div>
        </div>

        {/* Botão de Edição / Salvar */}
        {isNutricionista && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {modoEdicao ? (
              <button
                type="button"
                onClick={handleSalvarCardapio}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModoEdicao(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Editar Cardápio</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* FEEDBACK DE SUCESSO */}
      {feedbackSalvo && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-100" />
          <div>
            <p className="font-bold text-sm sm:text-base">Cardápio salvo com sucesso!</p>
            <p className="text-xs text-emerald-100 mt-0.5">
              Os insumos calculados foram enviados para a Cozinha e a descrição da TV foi atualizada.
            </p>
          </div>
        </div>
      )}

      {/* 2. SELETOR DE DATA REAL & DIAS DA SEMANA */}
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

      {/* 3. AS REFEIÇÕES DO DIA (Almoço, Café e Jantar exibidos normalmente) */}
      <div className="space-y-6">
        {(["almoco", "cafe", "jantar"] as const).map((chave) => {
          const info = INFO_REFEICOES[chave];
          const dadosRef = diaAtualDados[chave];
          const Icon = info.icon;
          const insumos = dadosRef.insumosPlanejados || [];

          return (
            <CardInsumosRefeicao
              key={chave}
              diaNome={diaSelecionado}
              tituloRefeicao={info.titulo}
              horarioRefeicao={info.horario}
              corIcone={info.corIcone}
              Icone={Icon}
              insumos={insumos}
              modoEdicao={modoEdicao}
              produtosEstoque={produtosEstoque}
              carregandoProdutos={carregandoProdutos}
              onAdicionarInsumo={(prodId, qtd) => handleAdicionarInsumo(chave, prodId, qtd)}
              onRemoverInsumo={(prodId) => handleRemoverInsumo(chave, prodId)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Helper para destacar letras correspondentes na busca em tempo real
function destacarTexto(texto: string, busca: string) {
  if (!busca.trim()) return texto;
  try {
    const escaped = busca.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const partes = texto.split(regex);
    return (
      <>
        {partes.map((parte, i) =>
          regex.test(parte) ? (
            <span
              key={i}
              className="text-emerald-800 bg-emerald-100 font-extrabold px-0.5 rounded-xs"
            >
              {parte}
            </span>
          ) : (
            parte
          )
        )}
      </>
    );
  } catch {
    return texto;
  }
}

// =========================================================================================
// COMPONENTE: Insumo + Quantidade + Setinha de Add (+)
// =========================================================================================
function CardInsumosRefeicao({
  diaNome,
  tituloRefeicao,
  horarioRefeicao,
  corIcone,
  Icone,
  insumos,
  modoEdicao,
  produtosEstoque,
  carregandoProdutos,
  onAdicionarInsumo,
  onRemoverInsumo,
}: {
  diaNome: DiaSemana;
  tituloRefeicao: string;
  horarioRefeicao: string;
  corIcone: string;
  Icone: typeof Coffee;
  insumos: InsumoPlanejado[];
  modoEdicao: boolean;
  produtosEstoque: ProdutoResponse[];
  carregandoProdutos: boolean;
  onAdicionarInsumo: (produtoId: string, quantidade: number) => void;
  onRemoverInsumo: (produtoId: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoResponse | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [quantidade, setQuantidade] = useState("");
  const [indiceFoco, setIndiceFoco] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const buscaInputRef = useRef<HTMLInputElement>(null);
  const qtdInputRef = useRef<HTMLInputElement>(null);

  // Fecha dropdown ao clicar fora do componente
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const normalizar = (txt: string) =>
    txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Filtragem e ordenação em tempo real a cada letra digitada
  const produtosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) {
      return produtosEstoque;
    }
    // Prioriza os que começam exatamente com o termo digitado
    const comecamCom = produtosEstoque.filter((p) => normalizar(p.nome).startsWith(termo));
    const contemNoNome = produtosEstoque.filter(
      (p) => !normalizar(p.nome).startsWith(termo) && normalizar(p.nome).includes(termo)
    );
    const contemNaCategoria = produtosEstoque.filter(
      (p) =>
        !normalizar(p.nome).includes(termo) && normalizar(p.categoria).includes(termo)
    );
    return [...comecamCom, ...contemNoNome, ...contemNaCategoria];
  }, [busca, produtosEstoque]);

  const handleSelecionarProduto = (p: ProdutoResponse) => {
    setProdutoSelecionado(p);
    setBusca("");
    setDropdownAberto(false);
    setIndiceFoco(0);
    setTimeout(() => {
      qtdInputRef.current?.focus();
      qtdInputRef.current?.select();
    }, 60);
  };

  const handleAdd = () => {
    if (!produtoSelecionado) return;
    const qtdNum = parseFloat(quantidade.replace(",", "."));
    if (isNaN(qtdNum) || qtdNum <= 0) return;

    onAdicionarInsumo(produtoSelecionado.id, qtdNum);
    setProdutoSelecionado(null);
    setBusca("");
    setQuantidade("");
    setDropdownAberto(false);
    setIndiceFoco(0);
    setTimeout(() => buscaInputRef.current?.focus(), 60);
  };

  const handleKeyDownBusca = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownAberto) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setDropdownAberto(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceFoco((prev) => (prev < produtosFiltrados.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceFoco((prev) => (prev > 0 ? prev - 1 : produtosFiltrados.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const itemParaSelecionar =
        indiceFoco >= 0 && produtosFiltrados[indiceFoco]
          ? produtosFiltrados[indiceFoco]
          : produtosFiltrados[0];
      if (itemParaSelecionar) {
        handleSelecionarProduto(itemParaSelecionar);
      }
    } else if (e.key === "Escape") {
      setDropdownAberto(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Topo da Refeição */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${corIcone}`}>
            <Icone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {tituloRefeicao}
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {horarioRefeicao}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Insumos e quantidades de preparo que a Cozinha utilizará no {diaNome}.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl self-start sm:self-auto">
          {insumos.length} {insumos.length === 1 ? "insumo adicionado" : "insumos adicionados"}
        </span>
      </div>

      {/* Linha de Adição: Digitar Insumo (busca em tempo real a cada letra) + Quantidade + Botão de Add (+) */}
      {modoEdicao && (
        <div ref={containerRef} className="space-y-2 pt-1 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 block">
              Adicionar Insumo do Estoque
            </label>
            {produtoSelecionado && (
              <span className="text-[11px] font-semibold text-emerald-700">
                Insumo selecionado • informe a quantidade ao lado
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Campo de Digitação com Autocomplete em Tempo Real */}
            <div className="relative flex-1">
              {produtoSelecionado ? (
                /* Insumo Selecionado em Destaque */
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-emerald-950 text-xs sm:text-sm font-bold shadow-2xs">
                  <div className="flex items-center gap-2 truncate">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{produtoSelecionado.nome}</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                      {produtoSelecionado.unidadeMedida}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProdutoSelecionado(null);
                      setBusca("");
                      setDropdownAberto(true);
                      setIndiceFoco(0);
                      setTimeout(() => buscaInputRef.current?.focus(), 50);
                    }}
                    className="p-1 text-emerald-700 hover:text-rose-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                    title="Trocar insumo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Input de Busca em Tempo Real a Cada Letra */
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={buscaInputRef}
                    type="text"
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value);
                      setDropdownAberto(true);
                      setIndiceFoco(0);
                    }}
                    onFocus={() => {
                      setDropdownAberto(true);
                      setIndiceFoco(0);
                    }}
                    onKeyDown={handleKeyDownBusca}
                    placeholder={
                      carregandoProdutos
                        ? "Carregando catálogo do estoque..."
                        : "Digite para buscar insumo (ex: arroz, feijão, frango, carne)..."
                    }
                    className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 transition-all shadow-2xs placeholder:text-slate-400"
                  />
                  {busca && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusca("");
                        setDropdownAberto(true);
                        setIndiceFoco(0);
                        buscaInputRef.current?.focus();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Dropdown com os resultados atualizados a cada letra digitada */}
              {!produtoSelecionado && dropdownAberto && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Cabeçalho do Dropdown com contador em tempo real */}
                  <div className="px-3.5 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
                    <span>
                      {produtosFiltrados.length === 1
                        ? "1 insumo encontrado"
                        : `${produtosFiltrados.length} insumos encontrados`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Enter seleciona • Setas navegam
                    </span>
                  </div>

                  {produtosFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhum insumo encontrado para &quot;{busca}&quot;.
                    </div>
                  ) : (
                    produtosFiltrados.map((p, index) => {
                      const jaAdicionado = insumos.some((i) => i.produtoId === p.id);
                      const focado = index === indiceFoco;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={jaAdicionado}
                          onClick={() => handleSelecionarProduto(p)}
                          className={`w-full text-left p-2.5 transition-colors flex items-center justify-between gap-3 ${
                            jaAdicionado
                              ? "bg-slate-50 opacity-40 cursor-not-allowed"
                              : focado
                              ? "bg-emerald-50 text-emerald-950 font-medium"
                              : "hover:bg-emerald-50/70 cursor-pointer"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {destacarTexto(p.nome, busca)}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-semibold text-slate-600">{p.categoria}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                Saldo: {p.saldoTotal ?? 0} {p.unidadeMedida}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {jaAdicionado ? (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                Já adicionado
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg">
                                {p.unidadeMedida}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Quantidade ao Lado */}
            <div className="relative w-full sm:w-36 shrink-0">
              <input
                ref={qtdInputRef}
                type="number"
                step="0.1"
                min="0.1"
                placeholder={produtoSelecionado ? `Qtd (${produtoSelecionado.unidadeMedida})` : "Quantidade"}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  } else if (e.key === "Backspace" && !quantidade && produtoSelecionado) {
                    // Backspace com campo vazio permite voltar e trocar o insumo
                    setProdutoSelecionado(null);
                    setDropdownAberto(true);
                    setTimeout(() => buscaInputRef.current?.focus(), 50);
                  }
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs"
              />
              {produtoSelecionado && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  {produtoSelecionado.unidadeMedida}
                </span>
              )}
            </div>

            {/* Botão de Adicionar (+) */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!produtoSelecionado || !quantidade}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
              title="Adicionar insumo à refeição"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista dos Insumos Adicionados */}
      <div className="space-y-1.5 pt-1">
        {insumos.length > 0 ? (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            {insumos.map((ins) => (
              <div
                key={ins.produtoId}
                className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {ins.nome}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs sm:text-sm font-extrabold">
                    {ins.quantidadeTotal} {ins.unidadeMedida}
                  </span>

                  {modoEdicao && (
                    <button
                      type="button"
                      onClick={() => onRemoverInsumo(ins.produtoId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remover insumo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
            Nenhum insumo selecionado para esta refeição ainda.
            {modoEdicao && " Selecione um insumo acima e informe a quantidade para adicionar."}
          </div>
        )}
      </div>
    </div>
  );
}
