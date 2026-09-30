"use client";

import { useState, useEffect, useMemo } from "react";
import SeletorRefeicao, { TipoRefeicao, obterRefeicaoPorHorario } from "@/app/components/SeletorRefeicao";
import CardapioCard from "@/app/components/CardapioCard";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  Info,
  AlertTriangle,
  AlertCircle,
  Loader2,
  X,
  Package,
  Utensils,
  Clock,
} from "lucide-react";
import { produtoService } from "@/lib/produtos";
import { registrarSaidaApi } from "@/lib/movimentacoes";

interface ItemFicha {
  id: string;
  nome: string;
  unidade: string;
  categoria: string;
  quantidadeUsada: number;
  saldoTotal: number;
}

interface ItemConsumoVisualizacao {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidadeUsada: number;
  saldoTotal: number;
}

interface ConsumoRefeicaoVisualizacao {
  data: string;
  refeicao: TipoRefeicao;
  horario?: string;
  observacao?: string;
  itens: ItemConsumoVisualizacao[];
}

const CATEGORIAS_PADRAO = [
  "Grãos & Cereais",
  "Proteínas & Frios",
  "Hortifrúti",
  "Laticínios",
  "Especificações & Condimentos",
] as const;

const LOCAL_CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";
const LOCAL_DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";

const obterDiaSemanaNome = (dataIso: string): "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" => {
  try {
    const d = new Date(dataIso + "T12:00:00");
    const dia = d.getDay();
    switch (dia) {
      case 1: return "Segunda";
      case 2: return "Terça";
      case 3: return "Quarta";
      case 4: return "Quinta";
      case 5: return "Sexta";
      default: return "Segunda";
    }
  } catch {
    return "Segunda";
  }
};

export default function ConsumoDiarioPage() {
  const { perfil } = useAuth();
  const isNutricionista = perfil === "NUTRICIONISTA";

  const [dataRegistro, setDataRegistro] = useState(
    new Date().toISOString().split("T")[0]
  );
  // Inicialização dinâmica: atualiza de acordo com o horário atual (ex.: 23h = Jantar)
  const [tipoRefeicao, setTipoRefeicao] = useState<TipoRefeicao>(obterRefeicaoPorHorario);

  const [itens, setItens] = useState<ItemFicha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [feedbackSucesso, setFeedbackSucesso] = useState(false);
  const [sucessoMensagem, setSucessoMensagem] = useState("");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);


  // Dados exclusivos de visualização enxuta para o Nutricionista
  const [consumoNutri, setConsumoNutri] = useState<ConsumoRefeicaoVisualizacao | null>(null);

  // Carrega produtos e seus saldos totais da API
  const carregarInsumos = async () => {
    try {
      setCarregando(true);
      setErroEnvio(null);
      const catalogo = await produtoService.listar();

      setItens((prev) => {
        const mapaQtd = new Map(prev.map((i) => [i.id, i.quantidadeUsada]));
        return catalogo.map((prod) => ({
          id: prod.id,
          nome: prod.nome,
          unidade: prod.unidadeMedida,
          categoria: prod.categoria,
          quantidadeUsada: mapaQtd.get(prod.id) || 0,
          saldoTotal: typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0,
        }));
      });
    } catch (err: unknown) {
      console.error("Erro ao carregar insumos do estoque:", err);
      setErroEnvio(
        "Não foi possível carregar os insumos do estoque. Verifique se o servidor está ativo ou se a sessão expirou."
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarInsumos();
  }, []);

  // Carrega os insumos lançados pela Cozinha para a visualização do Nutricionista
  useEffect(() => {
    if (!isNutricionista) return;
    try {
      const chave = `@gestao_refeitorio:consumo_${dataRegistro}_${tipoRefeicao}`;
      const salvo = typeof window !== "undefined" ? localStorage.getItem(chave) : null;
      if (salvo) {
        const parsed: ConsumoRefeicaoVisualizacao = JSON.parse(salvo);
        const itensAtualizados = parsed.itens.map((it) => {
          const prodNoCatalogo = itens.find((p) => p.id === it.id);
          return {
            ...it,
            saldoTotal: prodNoCatalogo ? prodNoCatalogo.saldoTotal : it.saldoTotal || 0,
          };
        });
        setConsumoNutri({ ...parsed, itens: itensAtualizados });
      } else {
        // Se for hoje e for Almoço e não houver lançamento ainda, exibe modelo demonstrativo
        const hojeIso = new Date().toISOString().split("T")[0];
        if (dataRegistro === hojeIso && tipoRefeicao === "Almoço" && itens.length > 0) {
          const itensExemplo: ItemConsumoVisualizacao[] = itens.slice(0, 4).map((prod, idx) => ({
            id: prod.id,
            nome: prod.nome,
            categoria: prod.categoria,
            unidade: prod.unidade,
            quantidadeUsada: idx === 0 ? 15 : idx === 1 ? 8 : idx === 2 ? 3 : 1.5,
            saldoTotal: prod.saldoTotal,
          }));
          setConsumoNutri({
            data: dataRegistro,
            refeicao: tipoRefeicao,
            horario: "12:30",
            observacao: "Preparo regular do almoço concluído.",
            itens: itensExemplo,
          });
        } else {
          setConsumoNutri(null);
        }
      }
    } catch (e) {
      console.error("Erro ao ler consumo salvo para nutricionista:", e);
      setConsumoNutri(null);
    }
  }, [dataRegistro, tipoRefeicao, isNutricionista, itens]);

  const cardapioAtual = useMemo(() => {
    try {
      if (typeof window !== "undefined") {
        const salvo = localStorage.getItem("@gestao_refeitorio:cardapio_semanal");
        if (salvo) {
          const semanal = JSON.parse(salvo);
          const diaNome = obterDiaSemanaNome(dataRegistro);
          const diaDados = semanal[diaNome];

          if (diaDados) {
            let info = "";
            if (tipoRefeicao === "Café da Manhã" && diaDados.cafe) {
              const partes = [
                diaDados.cafe.pratoPrincipal,
                diaDados.cafe.acompanhamentos ? `Acompanhamentos: ${diaDados.cafe.acompanhamentos}` : "",
                diaDados.cafe.saladaSobremesa ? `Fruta: ${diaDados.cafe.saladaSobremesa}` : "",
              ].filter(Boolean);
              info = partes.join(" • ");
            } else if (tipoRefeicao === "Almoço" && diaDados.almoco) {
              const partes = [
                diaDados.almoco.pratoPrincipal,
                diaDados.almoco.acompanhamentos ? `Guarnições: ${diaDados.almoco.acompanhamentos}` : "",
                diaDados.almoco.saladaSobremesa ? `Salada/Sobremesa: ${diaDados.almoco.saladaSobremesa}` : "",
              ].filter(Boolean);
              info = partes.join(" • ");
            } else if (tipoRefeicao === "Jantar" && diaDados.jantar) {
              const partes = [
                diaDados.jantar.pratoPrincipal,
                diaDados.jantar.acompanhamentos ? `Acompanhamentos: ${diaDados.jantar.acompanhamentos}` : "",
                diaDados.jantar.saladaSobremesa ? `Sobremesa: ${diaDados.jantar.saladaSobremesa}` : "",
              ].filter(Boolean);
              info = partes.join(" • ");
            }

            if (info.trim()) return info;
          }
        }
      }
    } catch (e) {
      console.error("Erro ao ler cardápio da semana:", e);
    }
    return "Nenhum cardápio cadastrado para esta refeição. O nutricionista pode definir no planejamento semanal.";
  }, [dataRegistro, tipoRefeicao]);

  // Controles de quantidade para a equipe da cozinha
  const alterarQuantidade = (id: string, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const novoCalculado = Number((item.quantidadeUsada + delta).toFixed(2));
        const saldoMaximo = Math.max(0, item.saldoTotal);

        if (delta > 0 && novoCalculado > saldoMaximo) {
          return { ...item, quantidadeUsada: saldoMaximo };
        }

        return {
          ...item,
          quantidadeUsada: Math.max(0, novoCalculado),
        };
      })
    );
  };

  const definirQuantidadeDireta = (id: string, valor: string) => {
    const parsed = parseFloat(valor);
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (isNaN(parsed) || parsed < 0) {
          return { ...item, quantidadeUsada: 0 };
        }

        const saldoMaximo = Math.max(0, item.saldoTotal);
        const validado = Math.min(parsed, saldoMaximo);

        return {
          ...item,
          quantidadeUsada: validado,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroEnvio(null);

    const itensParaBaixa = itens.filter((i) => i.quantidadeUsada > 0);

    if (itensParaBaixa.length === 0) {
      setErroEnvio("Selecione a quantidade de pelo menos um insumo para registrar a saída de consumo.");
      return;
    }

    const violacoesSaldo = itensParaBaixa.filter((i) => i.quantidadeUsada > i.saldoTotal);
    if (violacoesSaldo.length > 0) {
      const nomes = violacoesSaldo.map((i) => `${i.nome} (Saldo: ${i.saldoTotal} ${i.unidade})`).join(", ");
      setErroEnvio(`Operação cancelada: a quantidade informada excede o saldo em estoque para: ${nomes}.`);
      return;
    }

    try {
      setSalvando(true);

      for (const item of itensParaBaixa) {
        const cat = item.categoria.toLowerCase();
        const ehRefrigerado =
          cat.includes("proteína") ||
          cat.includes("proteina") ||
          cat.includes("frio") ||
          cat.includes("laticínio") ||
          cat.includes("laticinio");

        const localId = ehRefrigerado ? LOCAL_CONGELADOS : LOCAL_DESPENSA;

        await registrarSaidaApi({
          produtoId: item.id,
          localId,
          quantidade: item.quantidadeUsada,
          data: dataRegistro,
          tipoSaida: "CONSUMO",
        });
      }

      // Salva o registro no localStorage para que o Nutricionista consulte
      const registroSalvo: ConsumoRefeicaoVisualizacao = {
        data: dataRegistro,
        refeicao: tipoRefeicao,
        horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        observacao,
        itens: itensParaBaixa.map((i) => ({
          id: i.id,
          nome: i.nome,
          categoria: i.categoria,
          unidade: i.unidade,
          quantidadeUsada: i.quantidadeUsada,
          saldoTotal: Math.max(0, i.saldoTotal - i.quantidadeUsada),
        })),
      };

      try {
        localStorage.setItem(
          `@gestao_refeitorio:consumo_${dataRegistro}_${tipoRefeicao}`,
          JSON.stringify(registroSalvo)
        );
      } catch (e) {
        // ignore
      }

      setSucessoMensagem(
        `Consumo do ${tipoRefeicao} registrado com sucesso! ${itensParaBaixa.length} ${itensParaBaixa.length === 1 ? "insumo baixado" : "insumos baixados"
        }.`
      );
      setFeedbackSucesso(true);

      await carregarInsumos();
      setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })));
      setObservacao("");

      setTimeout(() => {
        setFeedbackSucesso(false);
      }, 4000);
    } catch (err: unknown) {
      console.error("Erro ao registrar consumo:", err);
      setErroEnvio(
        err instanceof Error
          ? err.message
          : "Erro de comunicação ao registrar consumo. Verifique se você está autenticado e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  };

  const todasCategorias = useMemo(() => {
    const setCats = new Set<string>();
    CATEGORIAS_PADRAO.forEach((c) => setCats.add(c));
    itens.forEach((i) => {
      if (i.categoria) setCats.add(i.categoria);
    });
    return Array.from(setCats);
  }, [itens]);

  const itensFiltrados = itens;

  const totalLancados = itens.filter((i) => i.quantidadeUsada > 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isNutricionista ? "Conferência de Consumo Diário" : "Registro de Insumos da Cozinha"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isNutricionista
              ? "Acompanhe os insumos utilizados no preparo de cada refeição."
              : "Lance as quantidades utilizadas no preparo para baixa direta e balanço diário."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isNutricionista ? (
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 border border-slate-300 rounded-xl shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="date"
                value={dataRegistro}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDataRegistro(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 border border-slate-200 rounded-xl shadow-2xs select-none">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Hoje</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          )}

          <SeletorRefeicao valor={tipoRefeicao} onChange={setTipoRefeicao} />
        </div>
      </div>

      {/* Alerta de erro */}
      {erroEnvio && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Atenção</p>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{erroEnvio}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErroEnvio(null)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cardápio do dia planejado */}
      <CardapioCard refeicao={tipoRefeicao} descricao={cardapioAtual} />

      {/* ============================================================== */}
      {/* 1. VISÃO EXCLUSIVA DO NUTRICIONISTA: Somente Visualização Enxuta */}
      {/* ============================================================== */}
      {isNutricionista ? (
        <div className="space-y-4">
          {carregando ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">Carregando dados de consumo da refeição...</p>
            </div>
          ) : consumoNutri && consumoNutri.itens.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Topo do Card de Consumo */}
              <div className="bg-slate-50/90 px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Insumos Utilizados no {tipoRefeicao}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Folha de consumo preenchida e confirmada pela equipe da cozinha.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Lançado pela Cozinha{consumoNutri.horario ? ` às ${consumoNutri.horario}` : ""}
                  </span>
                </div>
              </div>

              {/* Tabela de Insumos Enxuta */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-4 sm:px-6">Insumo Utilizado</th>
                      <th className="py-3 px-4 sm:px-6">Categoria</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Qtd. Utilizada</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Saldo Atual no Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {consumoNutri.itens.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-800">
                          {item.nome}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-500">
                          <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-md">
                            {item.categoria}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right font-extrabold text-emerald-700 text-sm sm:text-base">
                          {item.quantidadeUsada} {item.unidade}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right text-slate-600 font-medium">
                          {item.saldoTotal} {item.unidade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Observações da Cozinha */}
              {consumoNutri.observacao && (
                <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Anotações da Cozinha: </span>
                    <span>{consumoNutri.observacao}</span>
                  </div>
                </div>
              )}

              {/* Rodapé Resumo */}
              <div className="px-4 sm:px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Total de itens utilizados: <strong className="text-slate-800">{consumoNutri.itens.length}</strong></span>
                <span className="text-slate-400">Modo de visualização do nutricionista</span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Utensils className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-800">
                Nenhum insumo registrado para o {tipoRefeicao}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                A equipe da cozinha ainda não efetuou o lançamento do consumo referente a esta refeição na data selecionada.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* 2. VISÃO DA COZINHA: Lançamento Interativo Otimizado para Tablet */
        /* ============================================================== */
        <>
          {/* Banner de sucesso */}
          {feedbackSucesso && (
            <div className="p-4 sm:p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 sm:gap-4 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-emerald-100" />
              <div>
                <p className="font-bold text-sm sm:text-base">
                  {sucessoMensagem || "Consumo salvo com sucesso!"}
                </p>
                <p className="text-xs text-emerald-100">
                  O saldo do estoque foi atualizado automaticamente no sistema.
                </p>
              </div>
            </div>
          )}


          {/* Estado de Carregamento */}
          {carregando && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">Carregando insumos e saldos de estoque...</p>
              <p className="text-xs text-slate-400">Consultando o banco de dados em tempo real.</p>
            </div>
          )}

          {/* Lista vazia de catálogo */}
          {!carregando && itens.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
              <Package className="w-12 h-12 text-slate-300" />
              <p className="text-base font-bold text-slate-800">Nenhum insumo disponível no catálogo</p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                O catálogo do estoque está vazio. Acesse a tela de Recebimento para cadastrar entradas de mercadorias.
              </p>
              <Link
                href="/recebimento"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
              >
                Ir para Recebimento de Insumos
              </Link>
            </div>
          )}

          {/* Lista de Insumos da Ficha */}
          {!carregando && itens.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                {todasCategorias.map((catNome) => {
                  const itensDaCategoria = itensFiltrados.filter((i) => i.categoria === catNome);
                  if (itensDaCategoria.length === 0) return null;

                  return (
                    <div
                      key={catNome}
                      className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
                    >
                      <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-wide uppercase flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                          <span>{catNome}</span>
                        </h3>
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                          {itensDaCategoria.length} {itensDaCategoria.length === 1 ? "item" : "itens"}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {itensDaCategoria.map((item) => {
                          const emUso = item.quantidadeUsada > 0;
                          const semEstoque = item.saldoTotal <= 0;
                          const limiteEstoqueAtingido = item.quantidadeUsada >= item.saldoTotal && item.saldoTotal > 0;

                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${emUso ? "bg-emerald-50/40" : semEstoque ? "bg-slate-50/40 opacity-75" : "hover:bg-slate-50/60"
                                }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${emUso
                                        ? "bg-emerald-600 scale-125"
                                        : semEstoque
                                          ? "bg-rose-400"
                                          : "bg-slate-300"
                                      } transition-transform`}
                                  />
                                  <span
                                    className={`text-sm sm:text-base truncate ${emUso ? "font-bold text-slate-900" : "font-medium text-slate-700"
                                      }`}
                                  >
                                    {item.nome}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-5 sm:ml-0">
                                  <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-xs rounded-md">
                                    {item.unidade}
                                  </span>

                                  {semEstoque ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] sm:text-[11px] rounded-md">
                                      <AlertCircle className="w-3 h-3 text-rose-600" />
                                      Sem estoque (0 {item.unidade})
                                    </span>
                                  ) : item.saldoTotal <= 5 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 font-semibold text-[10px] sm:text-[11px] rounded-md">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      Disp: {item.saldoTotal} {item.unidade}
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-semibold text-[10px] sm:text-[11px] rounded-md">
                                      Disp: {item.saldoTotal} {item.unidade}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Controles de Quantidade (Tablet Friendly) */}
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <div
                                  className={`flex items-center border-2 rounded-xl bg-white shadow-2xs overflow-hidden w-full sm:w-auto justify-between sm:justify-start ${semEstoque
                                      ? "border-slate-200 bg-slate-50 opacity-80"
                                      : limiteEstoqueAtingido
                                        ? "border-amber-300"
                                        : "border-slate-300 focus-within:border-emerald-600"
                                    }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => alterarQuantidade(item.id, -0.5)}
                                    disabled={item.quantidadeUsada <= 0}
                                    title="Diminuir quantidade"
                                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    max={Math.max(0, item.saldoTotal)}
                                    step="0.1"
                                    disabled={semEstoque}
                                    value={item.quantidadeUsada || ""}
                                    placeholder="0"
                                    onChange={(e) => definirQuantidadeDireta(item.id, e.target.value)}
                                    className="w-20 sm:w-24 text-center font-black text-slate-900 text-base sm:text-lg py-2 bg-transparent focus:outline-none disabled:text-slate-400"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => alterarQuantidade(item.id, 0.5)}
                                    disabled={
                                      semEstoque ||
                                      item.quantidadeUsada >= item.saldoTotal
                                    }
                                    title={
                                      semEstoque
                                        ? "Insumo sem saldo em estoque"
                                        : item.quantidadeUsada >= item.saldoTotal
                                          ? "Limite do estoque atingido"
                                          : "Adicionar quantidade"
                                    }
                                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>

                                {limiteEstoqueAtingido && (
                                  <span className="text-[10px] font-bold text-amber-700">
                                    Limite máximo disponível atingido
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Observações da Cozinha */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2.5">
                <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Observações da Refeição (Sobras ou Ocorrências)</span>
                </label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex.: Sobra de 3kg de arroz; cozimento regular; substituição pontual autorizada..."
                  className="w-full border-2 border-slate-200 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="h-16 w-full" aria-hidden="true" />

              {/* Barra Flutuante de Ação no Rodapé (Cozinha) */}
              <div className="fixed bottom-4 left-0 right-0 lg:pl-64 px-4 sm:px-6 pointer-events-none z-30">
                <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200 py-3 px-4 sm:px-6 rounded-2xl shadow-xl pointer-events-auto flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-sm shrink-0">
                      {totalLancados}
                    </span>
                    <div className="leading-tight">
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {totalLancados === 1 ? "1 insumo selecionado" : `${totalLancados} insumos selecionados`}
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline ml-1.5">
                        • Para o {tipoRefeicao}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {totalLancados > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setItens((prev) => prev.map((item) => ({ ...item, quantidadeUsada: 0 })))
                        }
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={salvando || totalLancados === 0}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      {salvando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Registrando saída...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Registrar Consumo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}