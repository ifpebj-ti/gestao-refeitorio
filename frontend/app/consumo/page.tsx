"use client";

import { useState, useEffect, useMemo } from "react";
import SeletorRefeicao, { TipoRefeicao, obterRefeicaoPorHorario } from "@/app/components/SeletorRefeicao";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  Info,
  AlertCircle,
  Loader2,
  X,
  Package,
  Utensils,
  Search,
  ChevronDown,
} from "lucide-react";
import { produtoService, Produto } from "@/lib/produtos";
import { registrarSaidaApi } from "@/lib/movimentacoes";

interface ItemFicha {
  id: string;
  nome: string;
  unidadeBase: string;
  unidadeSelecionada: string;
  textoDigitado: string;
  quantidadeDigitada: number;
  quantidadeConvertida: number;
  saldoTotal: number;
  categoria: string;
  planejadoCardapio?: boolean;
  quantidadePlanejada?: number;
}

export function obterUnidadesDisponiveis(unidadeBase: string): string[] {
  const base = (unidadeBase || "").toLowerCase().trim();
  if (base === "kg" || base === "quilograma" || base === "quilo") {
    return ["Kg", "g"];
  }
  if (base === "g" || base === "grama" || base === "gramas") {
    return ["g", "Kg"];
  }
  if (base === "lt" || base === "l" || base === "litro" || base === "litros") {
    return ["Lt", "ml"];
  }
  if (base === "pct" || base === "pacote") {
    return ["Pct", "Und", "g", "Kg"];
  }
  if (base === "und" || base === "uni" || base === "unidade") {
    return ["Und", "Pct", "Cx"];
  }
  if (base === "maço" || base === "maco") {
    return ["Maço", "Und"];
  }
  if (base === "lata") {
    return ["Lata", "Und"];
  }
  if (base === "vidro") {
    return ["Vidro", "Und"];
  }
  return [unidadeBase || "Und", "g", "Kg"];
}

export function converterParaUnidadeBase(valor: number, unidadeEscolhida: string, unidadeBase: string): number {
  if (valor <= 0) return 0;
  const esc = (unidadeEscolhida || "").toLowerCase().trim();
  const base = (unidadeBase || "").toLowerCase().trim();

  // g -> kg
  if (esc === "g" && (base === "kg" || base === "quilo" || base === "quilograma")) {
    return Number((valor / 1000).toFixed(4));
  }
  // kg -> g
  if ((esc === "kg" || esc === "quilo") && base === "g") {
    return Number((valor * 1000).toFixed(2));
  }
  // ml -> lt
  if (esc === "ml" && (base === "lt" || base === "l" || base === "litro")) {
    return Number((valor / 1000).toFixed(4));
  }
  // lt -> ml
  if ((esc === "lt" || esc === "l") && base === "ml") {
    return Number((valor * 1000).toFixed(2));
  }
  return valor;
}

export function obterPassoIncremento(unidadeEscolhida: string): number {
  const esc = (unidadeEscolhida || "").toLowerCase().trim();
  if (esc === "g") return 50; // 50 em 50 gramas
  if (esc === "ml") return 100; // 100 em 100 ml
  if (esc === "kg" || esc === "lt" || esc === "l") return 0.5; // 0.5 em 0.5 kg/lt
  return 1; // 1 em 1 para Und, Pct, Maço, etc.
}

export function obterPassosRapidos(unidadeEscolhida: string): { label: string; valor: number }[] {
  const esc = (unidadeEscolhida || "").toLowerCase().trim();
  if (esc === "kg" || esc === "lt" || esc === "l") {
    return [
      { label: "+0.5", valor: 0.5 },
      { label: "+1", valor: 1 },
      { label: "+5", valor: 5 },
      { label: "+10", valor: 10 },
    ];
  }
  if (esc === "g") {
    return [
      { label: "+50g", valor: 50 },
      { label: "+100g", valor: 100 },
      { label: "+250g", valor: 250 },
      { label: "+500g", valor: 500 },
    ];
  }
  if (esc === "ml") {
    return [
      { label: "+100ml", valor: 100 },
      { label: "+250ml", valor: 250 },
      { label: "+500ml", valor: 500 },
    ];
  }
  return [
    { label: "+1", valor: 1 },
    { label: "+2", valor: 2 },
    { label: "+5", valor: 5 },
    { label: "+10", valor: 10 },
  ];
}

interface InsumoPlanejadoCardapio {
  produtoId: string;
  nome: string;
  unidadeMedida: string;
  quantidadeTotal: number;
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
  cardapioSnapshot?: {
    descricao: string;
    dadosRefeicao?: any;
    responsavel?: string;
  };
}


const LOCAL_CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";
const LOCAL_DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";

const obterHojeLocalIso = (): string => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

// Bloqueia e converte qualquer data de fim de semana (Sábado ou Domingo) para o dia útil escolar letivo (Sexta-feira)
const ajustarDataParaDiaUtil = (dataIso: string): string => {
  try {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    if (!ano || !mes || !dia) return dataIso;
    const d = new Date(ano, mes - 1, dia, 12, 0, 0);
    const diaSemana = d.getDay();
    if (diaSemana === 6) {
      // Sábado -> ajusta para sexta-feira anterior
      d.setDate(d.getDate() - 1);
    } else if (diaSemana === 0) {
      // Domingo -> ajusta para sexta-feira anterior
      d.setDate(d.getDate() - 2);
    } else {
      return dataIso;
    }
    const a = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const diaFinal = String(d.getDate()).padStart(2, "0");
    return `${a}-${m}-${diaFinal}`;
  } catch {
    return dataIso;
  }
};

const obterDataInicialConsumo = (): string => {
  const agora = new Date();
  const diaNum = agora.getDay();
  // No fim de semana (Sábado ou Domingo), o refeitório se posiciona na próxima Segunda-feira letiva
  if (diaNum === 6) {
    const seg = new Date(agora);
    seg.setDate(agora.getDate() + 2);
    const a = seg.getFullYear();
    const m = String(seg.getMonth() + 1).padStart(2, "0");
    const d = String(seg.getDate()).padStart(2, "0");
    return `${a}-${m}-${d}`;
  }
  if (diaNum === 0) {
    const seg = new Date(agora);
    seg.setDate(agora.getDate() + 1);
    const a = seg.getFullYear();
    const m = String(seg.getMonth() + 1).padStart(2, "0");
    const d = String(seg.getDate()).padStart(2, "0");
    return `${a}-${m}-${d}`;
  }
  return obterHojeLocalIso();
};

const obterDiaSemanaNome = (dataIso: string): "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | null => {
  try {
    const dataUtil = ajustarDataParaDiaUtil(dataIso);
    const [ano, mes, dia] = dataUtil.split("-").map(Number);
    if (!ano || !mes || !dia) return "Segunda";
    const d = new Date(ano, mes - 1, dia, 12, 0, 0);
    const diaNum = d.getDay();
    switch (diaNum) {
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

const mapearRefeicaoParaChave = (tipo: TipoRefeicao): "cafe" | "almoco" | "jantar" => {
  if (tipo === "Café da Manhã") return "cafe";
  if (tipo === "Almoço") return "almoco";
  return "jantar";
};

function extrairNumeroQuantidade(qtdStr?: string): number | undefined {
  if (!qtdStr) return undefined;
  const match = qtdStr.replace(/\s+/g, "").replace(",", ".").match(/(\d+(\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    if (!isNaN(num) && num > 0) return num;
  }
  return undefined;
}

const obterInsumosPlanejadosDoCardapio = (
  dataIso: string,
  tipo: TipoRefeicao
): InsumoPlanejadoCardapio[] => {
  try {
    const chave = mapearRefeicaoParaChave(tipo);
    const chaveCardapioData = `@gestao_refeitorio:cardapio_data_${dataIso}`;
    const cardapioDataSalvo = typeof window !== "undefined" ? localStorage.getItem(chaveCardapioData) : null;
    const cardapioSemanalSalvo = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:cardapio_semanal") : null;

    let refeicao: any = null;

    // Prioriza o cardápio datado específico se houver
    if (cardapioDataSalvo) {
      try {
        const parsedData = JSON.parse(cardapioDataSalvo);
        if (parsedData && parsedData[chave]) {
          refeicao = parsedData[chave];
        }
      } catch (e) {
        console.error("Erro ao ler cardápio datado:", e);
      }
    }

    // Se não encontrou no datado, recorre à grade semanal
    if (!refeicao && cardapioSemanalSalvo) {
      try {
        const semanal = JSON.parse(cardapioSemanalSalvo);
        const diaNome = obterDiaSemanaNome(dataIso);
        if (diaNome && semanal[diaNome]?.[chave]) {
          refeicao = semanal[diaNome][chave];
        }
      } catch (e) {
        console.error("Erro ao ler cardápio semanal:", e);
      }
    }

    if (refeicao) {
      const resultado: InsumoPlanejadoCardapio[] = [];

      const processarLinha = (nome: string, qtdStr?: string) => {
        if (!nome?.trim()) return;
        const limpo = nome.trim();

        // Se a linha contiver múltiplos ingredientes separados por "+" (ex: "beterraba cozida (5 kg) + cenoura (5 kg)")
        if (limpo.includes("+")) {
          const partes = limpo.split("+");
          for (const parte of partes) {
            const pLimpa = parte.trim();
            if (!pLimpa) continue;
            const matchQtd = pLimpa.match(/\(([^)]+)\)/);
            let itemNome = pLimpa;
            let itemQtd = qtdStr || "";
            if (matchQtd) {
              itemQtd = matchQtd[1].trim();
              itemNome = pLimpa.replace(/\([^)]+\)/, "").trim();
            }
            const qNum = extrairNumeroQuantidade(itemQtd);
            resultado.push({
              produtoId: `sub-${resultado.length + 1}`,
              nome: itemNome,
              unidadeMedida: itemQtd,
              quantidadeTotal: qNum !== undefined ? qNum : 0,
            });
          }
          return;
        }

        const qtdNum = extrairNumeroQuantidade(qtdStr);
        resultado.push({
          produtoId: `item-${resultado.length + 1}`,
          nome: limpo,
          unidadeMedida: qtdStr || "",
          quantidadeTotal: qtdNum !== undefined ? qtdNum : 0,
        });
      };

      // 1. Processa itens principais
      if (refeicao.itens && Array.isArray(refeicao.itens)) {
        for (const it of refeicao.itens) {
          processarLinha(it.nome, it.quantidade);
        }
      }

      // 2. Processa itens dedicados da aba de Salada
      if (refeicao.itensSalada && Array.isArray(refeicao.itensSalada)) {
        for (const it of refeicao.itensSalada) {
          processarLinha(it.nome, it.quantidade);
        }
      }

      // Se temos itens (principais ou de salada), retorna a lista oficial
      if (resultado.length > 0 || (Array.isArray(refeicao.itens) && Array.isArray(refeicao.itensSalada))) {
        return resultado;
      }

      // 3. Fallback retrocompatível para dados legados apenas se 'itens' não existir
      if (refeicao.saladaSobremesa?.trim()) {
        processarLinha(refeicao.saladaSobremesa);
      }
      if (refeicao.pratoPrincipal?.trim()) {
        processarLinha(refeicao.pratoPrincipal);
      }
      if (refeicao.acompanhamentos?.trim()) {
        processarLinha(refeicao.acompanhamentos);
      }
      if (refeicao.insumosPlanejados && Array.isArray(refeicao.insumosPlanejados)) {
        for (const ins of refeicao.insumosPlanejados) {
          resultado.push(ins);
        }
      }

      return resultado;
    }
  } catch (e) {
    console.error("Erro ao ler insumos planejados do cardápio:", e);
  }
  return [];
};

const CONDIMENTOS_E_TEMPEROS = new Set([
  "sal",
  "alho",
  "oleo",
  "oleo vegetal",
  "vinagre",
  "colorau",
  "cominho",
  "pimenta",
  "margarina",
  "cebola",
]);

function extrairIngredientePrincipal(nomeItem: string): string {
  let limpo = nomeItem.replace(/\s*\([^)]*\)/g, "").trim();
  // Remove prefixos como "Salada:", "Salada de", "Buffet de Salada:" para capturar o vegetal
  limpo = limpo.replace(/^(?:salada|buffet de salada|opcao vegetariana)\s*(?:de|com|:)?\s*/i, "").trim();
  const partes = limpo.split(/\s+(?:com|c\/|ao|à|a\s+la|com\s+molho)\s+/i);
  return partes[0].trim();
}

function itemCorrespondeAoProduto(p: InsumoPlanejadoCardapio, prod: Produto): boolean {
  if (p.produtoId && p.produtoId === prod.id) return true;

  const normalizar = (txt?: string) =>
    (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const prodNorm = normalizar(prod.nome);
  const pNorm = normalizar(p.nome);

  if (pNorm === prodNorm) return true;

  // Condimentos e temperos (Sal, Alho, Óleo): NUNCA casar por aproximação
  if (CONDIMENTOS_E_TEMPEROS.has(prodNorm) || prod.categoria?.toLowerCase().includes("condimento")) {
    return false;
  }

  const itemPrincipal = normalizar(extrairIngredientePrincipal(p.nome));
  if (!itemPrincipal) return false;

  // Se o ingrediente principal é idêntico ou começa com o nome do produto ou vice-versa
  if (itemPrincipal === prodNorm || prodNorm.startsWith(itemPrincipal) || itemPrincipal.startsWith(prodNorm)) {
    return true;
  }

  // Casamentos específicos por raiz de insumos comuns no refeitório
  if (prodNorm.includes("arroz") && itemPrincipal.includes("arroz")) return true;
  if (prodNorm.includes("feijao preto") && itemPrincipal.includes("feijao preto")) return true;
  if (prodNorm.includes("feijao carioca") && itemPrincipal.includes("feijao carioca")) return true;
  if (prodNorm.includes("feijao macassar") && itemPrincipal.includes("feijao macassar")) return true;
  if (prodNorm.includes("batata doce") && itemPrincipal.includes("batata doce")) return true;
  if (prodNorm.includes("macaxeira") && itemPrincipal.includes("macaxeira")) return true;
  if (prodNorm.includes("jerimum") && itemPrincipal.includes("jerimum")) return true;
  if (prodNorm.includes("pepino") && itemPrincipal.includes("pepino")) return true;
  if (prodNorm.includes("beterraba") && itemPrincipal.includes("beterraba")) return true;
  if (prodNorm.includes("cenoura") && itemPrincipal.includes("cenoura")) return true;
  if (prodNorm.includes("azeitona") && itemPrincipal.includes("azeitona")) return true;
  if (prodNorm.includes("suina") && (itemPrincipal.includes("suino") || itemPrincipal.includes("suina") || itemPrincipal.includes("picadinho suino"))) return true;
  if ((prodNorm.includes("frango") || prodNorm.includes("isca")) && (itemPrincipal.includes("frango") || itemPrincipal.includes("isca de frango"))) return true;
  if (prodNorm.includes("pao") && itemPrincipal.includes("pao")) return true;
  if (prodNorm.includes("farofa") && itemPrincipal.includes("farofa")) return true;
  if (prodNorm.includes("mungunza") && itemPrincipal.includes("mungunza")) return true;
  if (prodNorm.includes("ovo") && itemPrincipal.includes("ovo")) return true;

  return false;
}

const encontrarPlanejado = (prod: Produto, planejados: InsumoPlanejadoCardapio[]): number | undefined => {
  // Filtra todos os itens que correspondem a este produto (ex: Purê de Jerimum + Jerimum em Cubos)
  const correspondentes = planejados.filter((p) => itemCorrespondeAoProduto(p, prod));

  if (correspondentes.length === 0) {
    return undefined;
  }

  // Soma todas as quantidades planejadas para este mesmo insumo
  const total = correspondentes.reduce((acc, curr) => {
    return acc + (curr.quantidadeTotal > 0 ? curr.quantidadeTotal : 0);
  }, 0);

  return total > 0 ? Number(total.toFixed(3)) : undefined;
};

export default function ConsumoDiarioPage() {
  const { perfil } = useAuth();
  const isNutricionista = perfil === "NUTRICIONISTA";

  const [dataRegistro, setDataRegistro] = useState(obterDataInicialConsumo);
  // Inicialização dinâmica: atualiza de acordo com o horário atual (ex.: 23h = Jantar)
  const [tipoRefeicao, setTipoRefeicao] = useState<TipoRefeicao>(obterRefeicaoPorHorario);

  const [avisoFimDeSemana, setAvisoFimDeSemana] = useState(false);

  const ehFimDeSemanaDataRegistro = useMemo(() => {
    try {
      const [ano, mes, dia] = dataRegistro.split("-").map(Number);
      if (!ano || !mes || !dia) return false;
      const d = new Date(ano, mes - 1, dia, 12, 0, 0);
      const diaNum = d.getDay();
      return diaNum === 0 || diaNum === 6;
    } catch {
      return false;
    }
  }, [dataRegistro]);

  const handleMudarDataRegistro = (novaData: string) => {
    if (!novaData) return;
    const ajustada = ajustarDataParaDiaUtil(novaData);
    if (ajustada !== novaData) {
      setAvisoFimDeSemana(true);
      setTimeout(() => setAvisoFimDeSemana(false), 5000);
    }
    setDataRegistro(ajustada);
  };

  const [catalogoBase, setCatalogoBase] = useState<Produto[]>([]);
  const [itens, setItens] = useState<ItemFicha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [feedbackSucesso, setFeedbackSucesso] = useState(false);
  const [sucessoMensagem, setSucessoMensagem] = useState("");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // Estados de busca rápida e filtros da tabela da Cozinha
  const [termoBusca, setTermoBusca] = useState("");
  const [apenasComEstoque, setApenasComEstoque] = useState(false);

  // Dados exclusivos de visualização enxuta para o Nutricionista
  const [consumoNutri, setConsumoNutri] = useState<ConsumoRefeicaoVisualizacao | null>(null);

  // Carrega produtos e seus saldos totais da API em ordem alfabética da folha
  const carregarInsumos = async () => {
    try {
      setCarregando(true);
      setErroEnvio(null);
      const catalogo = await produtoService.listar();
      setCatalogoBase(catalogo);

      const planejados = obterInsumosPlanejadosDoCardapio(dataRegistro, tipoRefeicao);

      setItens(
        catalogo
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
          .map((prod) => {
            const qtdPlan = encontrarPlanejado(prod, planejados);
            const ehPlan = qtdPlan !== undefined && qtdPlan > 0;
            const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
            const undBase = prod.unidadeMedida || "Und";
            return {
              id: prod.id,
              nome: prod.nome,
              unidadeBase: undBase,
              unidadeSelecionada: undBase,
              textoDigitado: "",
              quantidadeDigitada: 0,
              quantidadeConvertida: 0,
              saldoTotal: saldo,
              categoria: prod.categoria,
              planejadoCardapio: ehPlan,
              quantidadePlanejada: ehPlan ? qtdPlan : undefined,
            };
          })
      );
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

  // Quando mudar a data ou a refeição selecionada, atualiza as referências planejadas mantendo os campos zerados para nova entrada
  useEffect(() => {
    if (catalogoBase.length === 0) return;
    const planejados = obterInsumosPlanejadosDoCardapio(dataRegistro, tipoRefeicao);

    setItens(
      catalogoBase
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
        .map((prod) => {
          const qtdPlan = encontrarPlanejado(prod, planejados);
          const ehPlan = qtdPlan !== undefined && qtdPlan > 0;
          const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
          const undBase = prod.unidadeMedida || "Und";
          return {
            id: prod.id,
            nome: prod.nome,
            unidadeBase: undBase,
            unidadeSelecionada: undBase,
            textoDigitado: "",
            quantidadeDigitada: 0,
            quantidadeConvertida: 0,
            saldoTotal: saldo,
            categoria: prod.categoria,
            planejadoCardapio: ehPlan,
            quantidadePlanejada: ehPlan ? qtdPlan : undefined,
          };
        })
    );
  }, [dataRegistro, tipoRefeicao, catalogoBase]);

  const MSG_CARDAPIO_PADRAO = "Nenhum cardápio cadastrado para esta refeição. O nutricionista pode definir no planejamento semanal.";
  const [cardapioAtual, setCardapioAtual] = useState<string>(MSG_CARDAPIO_PADRAO);
  const [dadosRefeicaoAtual, setDadosRefeicaoAtual] = useState<any>(null);

  const carregarDescricaoCardapio = (dataIso: string, tipo: TipoRefeicao) => {
    try {
      // 1. Se já existe um consumo registrado pela cozinha para esta data e refeição, usa o snapshot oficial de evidência
      const chaveConsumo = `@gestao_refeitorio:consumo_${dataIso}_${tipo}`;
      const consumoSalvo = typeof window !== "undefined" ? localStorage.getItem(chaveConsumo) : null;
      if (consumoSalvo) {
        try {
          const parsedConsumo = JSON.parse(consumoSalvo);
          if (parsedConsumo.cardapioSnapshot) {
            setDadosRefeicaoAtual(parsedConsumo.cardapioSnapshot.dadosRefeicao || null);
            setCardapioAtual(parsedConsumo.cardapioSnapshot.descricao || MSG_CARDAPIO_PADRAO);
            return;
          }
        } catch {
          // segue para busca de cardápio datado ou semanal
        }
      }

      // 2. Se existe um cardápio datado específico gravado para este dia
      const chaveCardapioData = `@gestao_refeitorio:cardapio_data_${dataIso}`;
      const cardapioDataSalvo = typeof window !== "undefined" ? localStorage.getItem(chaveCardapioData) : null;
      if (cardapioDataSalvo) {
        try {
          const parsedData = JSON.parse(cardapioDataSalvo);
          const chaveRef = mapearRefeicaoParaChave(tipo);
          if (parsedData && parsedData[chaveRef]) {
            const refData = parsedData[chaveRef];
            setDadosRefeicaoAtual(refData);
            if (refData.texto && typeof refData.texto === "string" && refData.texto.trim()) {
              setCardapioAtual(refData.texto.trim());
              return;
            }
            const partes: string[] = [];
            if (refData.itens && Array.isArray(refData.itens)) {
              for (const it of refData.itens) {
                if (it.nome?.trim()) {
                  partes.push(it.quantidade?.trim() ? `${it.nome.trim()} (${it.quantidade.trim()})` : it.nome.trim());
                }
              }
            }
            if (refData.itensSalada && Array.isArray(refData.itensSalada) && refData.itensSalada.length > 0) {
              const saladas = refData.itensSalada
                .filter((s: any) => s.nome?.trim())
                .map((s: any) => s.quantidade?.trim() ? `${s.nome.trim()} (${s.quantidade.trim()})` : s.nome.trim());
              if (saladas.length > 0) {
                partes.push(`Salada: ${saladas.join(" + ")}`);
              }
            }
            if (refData.observacoes?.trim()) {
              partes.push(`Obs: ${refData.observacoes.trim()}`);
            }
            if (partes.length > 0) {
              setCardapioAtual(partes.join(" • "));
              return;
            }
          }
        } catch {
          // segue para cardápio semanal
        }
      }

      // 3. Fallback para a grade semanal
      const salvo = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:cardapio_semanal") : null;
      if (salvo) {
        const semanal = JSON.parse(salvo);
        const diaNome = obterDiaSemanaNome(dataIso);
        if (!diaNome) {
          setDadosRefeicaoAtual(null);
          setCardapioAtual("Fim de semana — Não há cardápio escolar regular cadastrado.");
          return;
        }
        const diaDados = semanal[diaNome];

        if (diaDados) {
          const chave = mapearRefeicaoParaChave(tipo);
          const refeicao = diaDados[chave];

          const partes: string[] = [];
          if (refeicao) {
            setDadosRefeicaoAtual(refeicao);

            if (refeicao.texto && typeof refeicao.texto === "string" && refeicao.texto.trim()) {
              setCardapioAtual(refeicao.texto.trim());
              return;
            }

            // 1. Suporte prioritário às linhas de 2 colunas
            if (refeicao.itens && Array.isArray(refeicao.itens)) {
              for (const it of refeicao.itens) {
                if (!it.nome?.trim()) continue;
                partes.push(it.quantidade?.trim() ? `${it.nome.trim()} (${it.quantidade.trim()})` : it.nome.trim());
              }
            } else {
              // 2. Fallback legado apenas se 'itens' não existir
              if (refeicao.pratoPrincipal) partes.push(refeicao.pratoPrincipal);
              if (refeicao.acompanhamentos) partes.push(`Acompanhamentos: ${refeicao.acompanhamentos}`);
              if (refeicao.saladaSobremesa) partes.push(`Salada/Sobremesa: ${refeicao.saladaSobremesa}`);
              if (refeicao.bebida) partes.push(`Bebida: ${refeicao.bebida}`);
              if (refeicao.insumosPlanejados && Array.isArray(refeicao.insumosPlanejados) && refeicao.insumosPlanejados.length > 0) {
                const nomesInsumos = refeicao.insumosPlanejados
                  .map((i: any) => `${i.nome} (${i.quantidadeTotal} ${i.unidadeMedida})`)
                  .join(", ");
                partes.push(`Insumos planejados: ${nomesInsumos}`);
              }
            }

            if (refeicao.itensSalada && Array.isArray(refeicao.itensSalada) && refeicao.itensSalada.length > 0) {
              const saladas = refeicao.itensSalada
                .filter((s: any) => s.nome?.trim())
                .map((s: any) => s.quantidade?.trim() ? `${s.nome.trim()} (${s.quantidade.trim()})` : s.nome.trim());
              if (saladas.length > 0) {
                partes.push(`Salada: ${saladas.join(" + ")}`);
              }
            }

            if (refeicao.observacoes) partes.push(`Obs: ${refeicao.observacoes}`);
          }

          if (partes.length > 0) {
            setCardapioAtual(partes.join(" • "));
            return;
          }
        }
      }
    } catch (e) {
      console.error("Erro ao ler cardápio da semana:", e);
    }
    setDadosRefeicaoAtual(null);
    setCardapioAtual(MSG_CARDAPIO_PADRAO);
  };

  // Sincroniza em tempo real se o nutricionista alterar o cardápio
  useEffect(() => {
    const handleStorage = () => {
      carregarDescricaoCardapio(dataRegistro, tipoRefeicao);
      if (catalogoBase.length > 0) {
        const planejados = obterInsumosPlanejadosDoCardapio(dataRegistro, tipoRefeicao);
        setItens(
          catalogoBase
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
            .map((prod) => {
              const qtdPlan = encontrarPlanejado(prod, planejados);
              const ehPlan = qtdPlan !== undefined && qtdPlan > 0;
              const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
              const undBase = prod.unidadeMedida || "Und";
              return {
                id: prod.id,
                nome: prod.nome,
                unidadeBase: undBase,
                unidadeSelecionada: undBase,
                textoDigitado: "",
                quantidadeDigitada: 0,
                quantidadeConvertida: 0,
                saldoTotal: saldo,
                categoria: prod.categoria,
                planejadoCardapio: ehPlan,
                quantidadePlanejada: ehPlan ? qtdPlan : undefined,
              };
            })
        );
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [catalogoBase, dataRegistro, tipoRefeicao]);

  useEffect(() => {
    carregarDescricaoCardapio(dataRegistro, tipoRefeicao);
  }, [dataRegistro, tipoRefeicao]);

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
        setConsumoNutri(null);
      }
    } catch (e) {
      console.error("Erro ao ler consumo salvo para nutricionista:", e);
      setConsumoNutri(null);
    }
  }, [dataRegistro, tipoRefeicao, isNutricionista, itens]);

  // Altera a unidade de medida selecionada para o insumo
  const mudarUnidadeItem = (id: string, novaUnidade: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.unidadeSelecionada === novaUnidade) return item;

        let novoValor = item.quantidadeDigitada;
        const escAtual = item.unidadeSelecionada.toLowerCase().trim();
        const escNova = novaUnidade.toLowerCase().trim();

        // Conversão intuitiva ao trocar unidade:
        // Ex: De 0.5 Kg para g -> vira 500 g
        if ((escAtual === "kg" || escAtual === "quilo") && escNova === "g") {
          if (novoValor > 0 && novoValor <= 20) {
            novoValor = Number((novoValor * 1000).toFixed(0));
          }
        } else if (escAtual === "g" && (escNova === "kg" || escNova === "quilo")) {
          // De 500 g para Kg -> vira 0.5 Kg
          if (novoValor >= 50) {
            novoValor = Number((novoValor / 1000).toFixed(3));
          }
        } else if ((escAtual === "lt" || escAtual === "l") && escNova === "ml") {
          if (novoValor > 0 && novoValor <= 20) {
            novoValor = Number((novoValor * 1000).toFixed(0));
          }
        } else if (escAtual === "ml" && (escNova === "lt" || escNova === "l")) {
          if (novoValor >= 50) {
            novoValor = Number((novoValor / 1000).toFixed(3));
          }
        }

        const textoNovo = novoValor > 0 ? String(novoValor) : "";
        const conv = converterParaUnidadeBase(novoValor, novaUnidade, item.unidadeBase);

        return {
          ...item,
          unidadeSelecionada: novaUnidade,
          textoDigitado: textoNovo,
          quantidadeDigitada: novoValor,
          quantidadeConvertida: conv,
        };
      })
    );
  };

  // Controles de quantidade tátil (+ e -) adaptados ao passo da unidade selecionada
  const alterarQuantidade = (id: string, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const novoValor = Math.max(0, Number((item.quantidadeDigitada + delta).toFixed(2)));
        const conv = converterParaUnidadeBase(novoValor, item.unidadeSelecionada, item.unidadeBase);
        return {
          ...item,
          textoDigitado: novoValor > 0 ? String(novoValor) : "",
          quantidadeDigitada: novoValor,
          quantidadeConvertida: conv,
        };
      })
    );
  };

  // Digitação direta no teclado ou tablet
  const definirQuantidadeDireta = (id: string, valorStr: string) => {
    // Permite digitação natural de números, vírgula e ponto
    const textoLimpo = valorStr.replace(/[^0-9.,]/g, "");
    const parsed = parseFloat(textoLimpo.replace(",", "."));
    const valor = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const conv = converterParaUnidadeBase(valor, item.unidadeSelecionada, item.unidadeBase);
        return {
          ...item,
          textoDigitado: textoLimpo,
          quantidadeDigitada: valor,
          quantidadeConvertida: conv,
        };
      })
    );
  };

  // Zera a quantidade de uma linha
  const zerarItem = (id: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          textoDigitado: "",
          quantidadeDigitada: 0,
          quantidadeConvertida: 0,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroEnvio(null);

    const itensParaBaixa = itens.filter((i) => i.quantidadeDigitada > 0 && i.quantidadeConvertida > 0);

    if (itensParaBaixa.length === 0) {
      setErroEnvio("Informe a quantidade de pelo menos um insumo para registrar a saída de consumo.");
      return;
    }

    const violacoesSaldo = itensParaBaixa.filter((i) => i.quantidadeConvertida > i.saldoTotal);
    if (violacoesSaldo.length > 0) {
      const nomes = violacoesSaldo.map((i) => `${i.nome} (Saldo: ${i.saldoTotal} ${i.unidadeBase})`).join(", ");
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
          quantidade: item.quantidadeConvertida,
          data: dataRegistro,
          tipoSaida: "CONSUMO",
        });
      }

      // Salva o registro no localStorage para que o Nutricionista consulte com snapshot histórico de evidência
      const registroSalvo: ConsumoRefeicaoVisualizacao = {
        data: dataRegistro,
        refeicao: tipoRefeicao,
        horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        observacao,
        itens: itensParaBaixa.map((i) => ({
          id: i.id,
          nome: i.nome,
          categoria: i.categoria,
          unidade: i.unidadeSelecionada,
          quantidadeUsada: i.quantidadeDigitada,
          saldoTotal: Math.max(0, Number((i.saldoTotal - i.quantidadeConvertida).toFixed(2))),
        })),
        cardapioSnapshot: {
          descricao: cardapioAtual,
          dadosRefeicao: dadosRefeicaoAtual,
          responsavel:
            typeof window !== "undefined"
              ? localStorage.getItem("@gestao_refeitorio:cardapio_nutricionista") || "Nutricionista"
              : "Nutricionista",
        },
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
        `Consumo do ${tipoRefeicao} registrado com sucesso! ${itensParaBaixa.length} ${
          itensParaBaixa.length === 1 ? "insumo baixado" : "insumos baixados"
        }.`
      );
      setFeedbackSucesso(true);

      await carregarInsumos();
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

  const itensExibicao = useMemo(() => {
    return itens.filter((item) => {
      // 1. Filtro de estoque
      if (apenasComEstoque && item.saldoTotal <= 0 && item.quantidadeDigitada <= 0) {
        return false;
      }
      // 2. Filtro de busca textual
      if (termoBusca.trim() !== "") {
        const termo = termoBusca.toLowerCase().trim();
        const nomeMatch = item.nome.toLowerCase().includes(termo);
        if (!nomeMatch) return false;
      }
      return true;
    });
  }, [itens, apenasComEstoque, termoBusca]);

  const totalLancados = itens.filter((i) => i.quantidadeDigitada > 0).length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-3.5">
      {/* Cabeçalho Enxuto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isNutricionista ? "Conferência de Consumo Diário" : "Registro de Insumos da Cozinha"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isNutricionista
              ? "Acompanhe os insumos utilizados no preparo de cada refeição."
              : "Lance as quantidades utilizadas no preparo para baixa direta e balanço diário."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Calendário: Cozinha NÃO pode sair do dia atual (abre em segunda se for fim de semana); Nutri pode navegar */}
          {isNutricionista ? (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded-xl shadow-2xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="date"
                value={dataRegistro}
                onChange={(e) => handleMudarDataRegistro(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-500 border-l border-slate-200 pl-2">
                {(() => {
                  const [ano, mes, dia] = dataRegistro.split("-").map(Number);
                  if (!ano || !mes || !dia) return "";
                  const d = new Date(ano, mes - 1, dia, 12, 0, 0);
                  const diaNum = d.getDay();
                  const nomes = ["Dom", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sáb"];
                  return nomes[diaNum] || "";
                })()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded-xl shadow-2xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {(() => {
                  const [ano, mes, dia] = dataRegistro.split("-").map(Number);
                  if (!ano || !mes || !dia) return dataRegistro;
                  const d = new Date(ano, mes - 1, dia, 12, 0, 0);
                  const diaNum = d.getDay();
                  const nomes = ["Dom", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sáb"];
                  const diaFormatado = String(dia).padStart(2, "0");
                  const mesFormatado = String(mes).padStart(2, "0");
                  return `${diaFormatado}/${mesFormatado}/${ano} (${nomes[diaNum] || ""})`;
                })()}
              </span>
            </div>
          )}

          <SeletorRefeicao valor={tipoRefeicao} onChange={setTipoRefeicao} />
        </div>
      </div>

      {/* Aviso de Fim de semana (Apenas dias úteis letivos) */}
      {avisoFimDeSemana && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 text-xs font-medium animate-in fade-in duration-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>O refeitório escolar funciona exclusivamente de segunda a sexta-feira. A data foi ajustada para o dia útil letivo.</span>
        </div>
      )}

      {/* Alerta de erro */}
      {erroEnvio && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">Atenção</p>
              <p className="text-xs text-rose-700 mt-0.5">{erroEnvio}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErroEnvio(null)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}



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
                    Lançado pela Cozinha{consumoNutri.data ? ` em ${(() => {
                      const partes = consumoNutri.data.split("-");
                      return partes.length === 3 ? `${partes[2]}/${partes[1]}` : consumoNutri.data;
                    })()}` : ""}{consumoNutri.horario ? ` às ${consumoNutri.horario}` : ""}
                  </span>
                </div>
              </div>

              {/* Tabela de Insumos Enxuta */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-4 sm:px-6">Insumo Utilizado</th>
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
      ) : ehFimDeSemanaDataRegistro ? (
        <div className="bg-white border border-amber-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Refeitório Fechado no Fim de Semana
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            O registro e baixa de consumo da cozinha funciona exclusivamente nos dias letivos (segunda a sexta-feira). No fim de semana não há refeições escolares cadastradas nem preparo regular.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
            Próximo dia letivo: Segunda-feira
          </div>
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
                O catálogo do estoque está vazio.
              </p>
              {isNutricionista && (
                <Link
                  href="/recebimento"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  Ir para Recebimento de Insumos
                </Link>
              )}
            </div>
          )}

          {/* Lista de Insumos da Ficha no Formato da Folha Física */}
          {!carregando && itens.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Barra de Filtros e Busca no Topo da Tabela */}
                <div className="p-3 sm:px-4 sm:py-3 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  {/* Campo de Busca Rápida */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      placeholder="Buscar insumo na lista (ex: Açúcar, Alho, Frango, Sal)..."
                      className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                    />
                    {termoBusca && (
                      <button
                        type="button"
                        onClick={() => setTermoBusca("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtro simples: Ocultar sem estoque e contador discreto */}
                  <div className="flex items-center gap-3 self-start md:self-auto">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer bg-white px-3 py-1.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs">
                      <input
                        type="checkbox"
                        checked={apenasComEstoque}
                        onChange={(e) => setApenasComEstoque(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Ocultar sem estoque</span>
                    </label>

                    {totalLancados > 0 && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        {totalLancados} preenchido{totalLancados > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. VISÃO MOBILE (< md): Cards compactos fluidos que cabem 100% na largura da tela sem cortes */}
                <div className="md:hidden divide-y divide-slate-100">
                  {itensExibicao.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Nenhum insumo encontrado para a busca informada.
                    </div>
                  ) : (
                    itensExibicao.map((item) => {
                      const emUso = item.quantidadeDigitada > 0;
                      const semEstoque = item.saldoTotal <= 0;
                      const limiteAtingido = item.quantidadeConvertida > item.saldoTotal && item.saldoTotal > 0;
                      const unidadesOpcoes = obterUnidadesDisponiveis(item.unidadeBase);
                      const passo = obterPassoIncremento(item.unidadeSelecionada);

                      return (
                        <div
                          key={item.id}
                          className={`p-3 transition-colors border-l-4 ${
                            emUso
                              ? "bg-emerald-50/40 border-l-emerald-500"
                              : semEstoque
                              ? "bg-slate-50/30 opacity-75 border-l-transparent"
                              : "bg-white hover:bg-slate-50/60 border-l-transparent"
                          }`}
                        >
                          {/* Topo do Card Mobile: Nome do Insumo e Unidade */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-bold text-sm leading-tight ${emUso ? "text-slate-900" : "text-slate-800"}`}>
                                  {item.nome}
                                </span>
                                {emUso && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </div>
                              <div className="mt-0.5">
                                {semEstoque ? (
                                  <span className="text-[10px] font-bold text-rose-600">
                                    Sem estoque (0 {item.unidadeBase})
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-emerald-700">
                                    Disponível: {item.saldoTotal} {item.unidadeBase}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dropdown de Unidade de Medida Organizado */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="relative inline-flex items-center">
                                <select
                                  value={item.unidadeSelecionada}
                                  onChange={(e) => mudarUnidadeItem(item.id, e.target.value)}
                                  className="bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl pl-2.5 pr-7 py-1 text-xs font-bold text-slate-800 shadow-2xs appearance-none cursor-pointer transition-all"
                                >
                                  {unidadesOpcoes.map((u) => (
                                    <option key={u} value={u} className="text-slate-800 font-bold">
                                      {u}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 pointer-events-none" />
                              </div>

                              {emUso && (
                                <button
                                  type="button"
                                  onClick={() => zerarItem(item.id)}
                                  title="Limpar lançamento"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Linha de Quantidade Mobile: Apenas Stepper Limpo sem botões automáticos */}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div
                              className={`inline-flex items-center border-2 rounded-xl bg-white shadow-2xs overflow-hidden transition-all ${
                                semEstoque
                                  ? "border-slate-200 bg-slate-50 opacity-70"
                                  : limiteAtingido
                                  ? "border-amber-400 ring-2 ring-amber-100"
                                  : emUso
                                  ? "border-emerald-500 ring-2 ring-emerald-100"
                                  : "border-slate-300"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => alterarQuantidade(item.id, -passo)}
                                disabled={item.quantidadeDigitada <= 0 || semEstoque}
                                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-600 active:bg-rose-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>

                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={semEstoque}
                                value={item.textoDigitado}
                                placeholder="0"
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => definirQuantidadeDireta(item.id, e.target.value)}
                                className="w-16 text-center font-black text-slate-900 text-base py-1 bg-transparent focus:outline-none disabled:text-slate-400 disabled:cursor-not-allowed"
                              />

                              <button
                                type="button"
                                onClick={() => alterarQuantidade(item.id, passo)}
                                disabled={semEstoque}
                                className="w-10 h-10 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Avisos de Conversão ou Limite no Mobile */}
                          {(emUso && item.unidadeSelecionada !== item.unidadeBase) || limiteAtingido ? (
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              {emUso && item.unidadeSelecionada !== item.unidadeBase && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                                  ↳ Baixa: {item.quantidadeConvertida} {item.unidadeBase}
                                </span>
                              )}
                              {limiteAtingido && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                                  Excede saldo ({item.saldoTotal} {item.unidadeBase})
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 2. VISÃO DESKTOP (>= md): Tabela completa tradicional */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 sm:px-6">Especificação do Insumo</th>
                        <th className="py-3.5 px-3 sm:px-4 w-32 sm:w-44 text-center">Unidade (UND)</th>
                        <th className="py-3.5 px-3 sm:px-4 w-52 sm:w-64 text-center">Quantidade Utilizada</th>
                        <th className="py-3.5 px-3 sm:px-4 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itensExibicao.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            Nenhum insumo encontrado para a busca informada.
                          </td>
                        </tr>
                      ) : (
                        itensExibicao.map((item) => {
                          const emUso = item.quantidadeDigitada > 0;
                          const semEstoque = item.saldoTotal <= 0;
                          const limiteAtingido = item.quantidadeConvertida > item.saldoTotal && item.saldoTotal > 0;
                          const unidadesOpcoes = obterUnidadesDisponiveis(item.unidadeBase);
                          const passo = obterPassoIncremento(item.unidadeSelecionada);

                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors border-l-4 ${
                                emUso
                                  ? "bg-emerald-50/40 hover:bg-emerald-50/60 border-l-emerald-500"
                                  : semEstoque
                                  ? "bg-slate-50/30 opacity-75 hover:bg-slate-50/60 border-l-transparent"
                                  : "hover:bg-slate-50/80 border-l-transparent"
                              }`}
                            >
                              {/* Nome e Saldo */}
                              <td className="py-3 px-4 sm:px-6">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                      emUso
                                        ? "bg-emerald-600 scale-125 ring-2 ring-emerald-200"
                                        : semEstoque
                                        ? "bg-rose-400"
                                        : "bg-slate-300"
                                    } transition-all`}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold ${emUso ? "text-slate-900 text-sm sm:text-base" : "text-slate-800"}`}>
                                        {item.nome}
                                      </span>
                                      {emUso && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      )}
                                    </div>
                                    <div className="mt-0.5">
                                      {semEstoque ? (
                                        <span className="text-[10px] font-bold text-rose-600">
                                          Sem estoque (0 {item.unidadeBase})
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-medium text-emerald-700">
                                          Disponível: {item.saldoTotal} {item.unidadeBase}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Seletor de Unidade via Dropdown Organizado */}
                              <td className="py-3 px-2 sm:px-4 text-center">
                                <div className="relative inline-flex items-center">
                                  <select
                                    value={item.unidadeSelecionada}
                                    onChange={(e) => mudarUnidadeItem(item.id, e.target.value)}
                                    className="bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 shadow-2xs appearance-none cursor-pointer transition-all"
                                  >
                                    {unidadesOpcoes.map((u) => (
                                      <option key={u} value={u} className="text-slate-800 font-bold">
                                        {u}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
                                </div>
                              </td>

                              {/* Controles de Quantidade: Apenas Stepper Limpo sem botões automáticos */}
                              <td className="py-3 px-2 sm:px-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {/* Stepper Principal */}
                                  <div
                                    className={`inline-flex items-center border-2 rounded-2xl bg-white shadow-2xs overflow-hidden transition-all ${
                                      semEstoque
                                        ? "border-slate-200 bg-slate-50 opacity-70"
                                        : limiteAtingido
                                        ? "border-amber-400 ring-2 ring-amber-100"
                                        : emUso
                                        ? "border-emerald-500 ring-3 ring-emerald-100"
                                        : "border-slate-300 hover:border-slate-400 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => alterarQuantidade(item.id, -passo)}
                                      disabled={item.quantidadeDigitada <= 0 || semEstoque}
                                      title={`Diminuir ${passo} ${item.unidadeSelecionada}`}
                                      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-600 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>

                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={semEstoque}
                                      value={item.textoDigitado}
                                      placeholder="0"
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => definirQuantidadeDireta(item.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "ArrowUp") {
                                          e.preventDefault();
                                          alterarQuantidade(item.id, passo);
                                        } else if (e.key === "ArrowDown") {
                                          e.preventDefault();
                                          alterarQuantidade(item.id, -passo);
                                        }
                                      }}
                                      className="w-16 sm:w-20 text-center font-black text-slate-900 text-base sm:text-lg py-1.5 bg-transparent focus:outline-none disabled:text-slate-400 disabled:cursor-not-allowed"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => alterarQuantidade(item.id, passo)}
                                      disabled={semEstoque}
                                      title={`Aumentar ${passo} ${item.unidadeSelecionada}`}
                                      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Exibição da conversão em Kg/Lt oficial */}
                                  {emUso && item.unidadeSelecionada !== item.unidadeBase && (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                                      ↳ Baixa: {item.quantidadeConvertida} {item.unidadeBase}
                                    </span>
                                  )}

                                  {limiteAtingido && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                                      Excede saldo ({item.saldoTotal} {item.unidadeBase})
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Botão Zerar Linha */}
                              <td className="py-3 px-2 sm:px-4 text-center">
                                {emUso ? (
                                  <button
                                    type="button"
                                    onClick={() => zerarItem(item.id)}
                                    title="Limpar lançamento deste insumo"
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition-all cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="w-8 inline-block" />
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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

              <div className="h-20 sm:h-24 w-full" aria-hidden="true" />

              {/* Barra Flutuante de Ação no Rodapé (Cozinha) */}
              <div className="fixed bottom-2 sm:bottom-4 left-0 right-0 lg:pl-64 px-3 sm:px-6 pointer-events-none z-30">
                <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200 py-2 sm:py-3 px-3 sm:px-6 rounded-2xl shadow-xl pointer-events-auto flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0">
                      {totalLancados}
                    </span>
                    <div className="leading-tight truncate">
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {totalLancados === 1 ? "1 insumo" : `${totalLancados} insumos`}
                        <span className="hidden xs:inline"> selecionado{totalLancados > 1 ? "s" : ""}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline ml-1.5">
                        • {tipoRefeicao}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {totalLancados > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setItens((prev) =>
                            prev.map((item) => ({
                              ...item,
                              textoDigitado: "",
                              quantidadeDigitada: 0,
                              quantidadeConvertida: 0,
                            }))
                          )
                        }
                        className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={salvando || totalLancados === 0}
                      className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {salvando ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          <span>Registrando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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