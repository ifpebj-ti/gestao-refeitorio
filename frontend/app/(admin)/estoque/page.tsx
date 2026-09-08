"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  PackagePlus,
  Building2,
  CheckCircle2,
  Upload,
  Camera,
  Clock,
  FileText,
  Eye,
  X,
  ImageIcon,
} from "lucide-react";
import { verificarStatusEstoque, CategoriaAlimento } from "@/app/utils/estoqueRules";

interface ItemEstoque {
  id: string;
  nome: string;
  categoria: CategoriaAlimento;
  unidade: string;
  saldoAtual: number;
  dataValidade?: string;
  diasValidade?: number;
  fornecedorPrincipal: string;
}

interface ItemMovimentadoDetalhe {
  insumo: string;
  quantidade: number;
  unidade: string;
}

interface MovimentacaoExtrato {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  dataHora: string;
  origemTurno: string;
  responsavel: string;
  itensResumo: string;
  detalhesItens: ItemMovimentadoDetalhe[];
  fornecedor?: string;
  lote?: string;
  validade?: string;
  observacao?: string;
  fotoAnexada?: string;
}

const CATEGORIAS = [
  "Todos",
  "Grãos & Cereais",
  "Proteínas & Frios",
  "Hortifrúti",
  "Laticínios",
  "Especificações & Condimentos",
] as const;

// 58 ITENS COMPLETOS E EQUALIZADOS
const TODOS_ITENS_ESTOQUE: ItemEstoque[] = [
  // --- GRÃOS & CEREAIS (7 itens) ---
  { id: "g1", nome: "Arroz Parboilizado", categoria: "Grãos & Cereais", unidade: "Kg", saldoAtual: 20, dataValidade: "15/12/2026", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "g2", nome: "Feijão Carioca", categoria: "Grãos & Cereais", unidade: "Kg", saldoAtual: 45, dataValidade: "20/11/2026", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "g3", nome: "Feijão Macassar", categoria: "Grãos & Cereais", unidade: "Kg", saldoAtual: 35, dataValidade: "10/11/2026", fornecedorPrincipal: "Cooperativa Vale do Ipojuca" },
  { id: "g4", nome: "Macarrão Espaguete", categoria: "Grãos & Cereais", unidade: "Kg", saldoAtual: 28, dataValidade: "05/01/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "g5", nome: "Macarrão (Sopa)", categoria: "Grãos & Cereais", unidade: "Kg", saldoAtual: 14, dataValidade: "02/01/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "g6", nome: "Flocão de Milho (Cuscuz)", categoria: "Grãos & Cereais", unidade: "Kg", saldoAtual: 60, dataValidade: "18/10/2026", fornecedorPrincipal: "Cerealista Central" },
  { id: "g7", nome: "Farinha de Mandioca (Farofa)", categoria: "Grãos & Cereais", unidade: "Kg", saldoAtual: 22, dataValidade: "30/11/2026", fornecedorPrincipal: "Cooperativa Vale do Ipojuca" },

  // --- PROTEÍNAS & FRIOS (8 itens) ---
  { id: "p1", nome: "Peito de Frango", categoria: "Proteínas & Frios", unidade: "Kg", saldoAtual: 15, dataValidade: "08/09/2026", diasValidade: 2, fornecedorPrincipal: "Avícola Regional" },
  { id: "p2", nome: "Coxa de Frango", categoria: "Proteínas & Frios", unidade: "Kg", saldoAtual: 52, dataValidade: "11/09/2026", diasValidade: 5, fornecedorPrincipal: "Avícola Regional" },
  { id: "p3", nome: "Carne Bovina (Patinho/Moída)", categoria: "Proteínas & Frios", unidade: "Kg", saldoAtual: 25, dataValidade: "14/09/2026", fornecedorPrincipal: "Frigorífico Belo Jardim" },
  { id: "p4", nome: "Carne Bovina (Acém/Cozido)", categoria: "Proteínas & Frios", unidade: "Kg", saldoAtual: 30, dataValidade: "15/09/2026", fornecedorPrincipal: "Frigorífico Belo Jardim" },
  { id: "p5", nome: "Charque", categoria: "Proteínas & Frios", unidade: "Kg", saldoAtual: 18, dataValidade: "20/10/2026", fornecedorPrincipal: "Frigorífico Belo Jardim" },
  { id: "p6", nome: "Linguiça Calabresa", categoria: "Proteínas & Frios", unidade: "Kg", saldoAtual: 12, dataValidade: "28/09/2026", fornecedorPrincipal: "Frigorífico Belo Jardim" },
  { id: "p7", nome: "Bacon", categoria: "Proteínas & Frios", unidade: "Kg", saldoAtual: 8, dataValidade: "05/10/2026", fornecedorPrincipal: "Frigorífico Belo Jardim" },
  { id: "p8", nome: "Ovos Pasteurizados / Cartela", categoria: "Proteínas & Frios", unidade: "Und", saldoAtual: 180, dataValidade: "22/09/2026", fornecedorPrincipal: "Granja São José" },

  // --- HORTIFRÚTI (13 itens) ---
  { id: "h1", nome: "Abóbora", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 16, dataValidade: "18/09/2026", fornecedorPrincipal: "Feirante Local" },
  { id: "h2", nome: "Alho in natura", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 1.5, dataValidade: "25/09/2026", fornecedorPrincipal: "Feirante Local" },
  { id: "h3", nome: "Alho triturado", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 4, dataValidade: "15/10/2026", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "h4", nome: "Banana", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 35, dataValidade: "10/09/2026", diasValidade: 4, fornecedorPrincipal: "Cooperativa Vale do Ipojuca" },
  { id: "h5", nome: "Batata Inglesa", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 24, dataValidade: "20/09/2026", fornecedorPrincipal: "Feirante Local" },
  { id: "h6", nome: "Beterraba", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 14, dataValidade: "17/09/2026", fornecedorPrincipal: "Feirante Local" },
  { id: "h7", nome: "Cebola", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 18, dataValidade: "25/09/2026", fornecedorPrincipal: "Feirante Local" },
  { id: "h8", nome: "Cebolinha", categoria: "Hortifrúti", unidade: "Maço", saldoAtual: 10, dataValidade: "09/09/2026", diasValidade: 3, fornecedorPrincipal: "Feirante Local" },
  { id: "h9", nome: "Cenoura", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 22, dataValidade: "19/09/2026", fornecedorPrincipal: "Feirante Local" },
  { id: "h10", nome: "Coentro", categoria: "Hortifrúti", unidade: "Maço", saldoAtual: 9, dataValidade: "09/09/2026", diasValidade: 3, fornecedorPrincipal: "Feirante Local" },
  { id: "h11", nome: "Pimentão", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 11, dataValidade: "14/09/2026", fornecedorPrincipal: "Feirante Local" },
  { id: "h12", nome: "Tomate", categoria: "Hortifrúti", unidade: "Kg", saldoAtual: 12, dataValidade: "10/09/2026", diasValidade: 4, fornecedorPrincipal: "Feirante Local" },
  { id: "h13", nome: "Couve", categoria: "Hortifrúti", unidade: "Maço", saldoAtual: 8, dataValidade: "09/09/2026", diasValidade: 3, fornecedorPrincipal: "Feirante Local" },

  // --- LATICÍNIOS (5 itens) ---
  { id: "l1", nome: "Leite in natura", categoria: "Laticínios", unidade: "Lt", saldoAtual: 20, dataValidade: "09/09/2026", diasValidade: 3, fornecedorPrincipal: "Cooperativa Vale do Ipojuca" },
  { id: "l2", nome: "Creme de Leite", categoria: "Laticínios", unidade: "Und", saldoAtual: 26, dataValidade: "15/12/2026", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "l3", nome: "Margarina", categoria: "Laticínios", unidade: "Kg", saldoAtual: 12, dataValidade: "20/11/2026", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "l4", nome: "Queijo Mussarela", categoria: "Laticínios", unidade: "Kg", saldoAtual: 15, dataValidade: "24/09/2026", fornecedorPrincipal: "Laticínios do Vale" },
  { id: "l5", nome: "Queijo Ralado", categoria: "Laticínios", unidade: "Pct", saldoAtual: 30, dataValidade: "10/01/2027", fornecedorPrincipal: "Distribuidora Bela" },

  // --- ESPECIFICAÇÕES & CONDIMENTOS (25 itens) ---
  { id: "e1", nome: "Açafrão", categoria: "Especificações & Condimentos", unidade: "g", saldoAtual: 800, dataValidade: "30/03/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e2", nome: "Açúcar Cristal", categoria: "Especificações & Condimentos", unidade: "Kg", saldoAtual: 65, dataValidade: "15/04/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e3", nome: "Água Mineral", categoria: "Especificações & Condimentos", unidade: "Lt", saldoAtual: 120, dataValidade: "10/02/2027", fornecedorPrincipal: "Fonte Pura" },
  { id: "e4", nome: "Amido de Milho", categoria: "Especificações & Condimentos", unidade: "Kg", saldoAtual: 14, dataValidade: "25/01/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e5", nome: "Azeite de Oliva", categoria: "Especificações & Condimentos", unidade: "Lt", saldoAtual: 8, dataValidade: "12/03/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e6", nome: "Biscoito Cream Cracker", categoria: "Especificações & Condimentos", unidade: "Pct", saldoAtual: 48, dataValidade: "18/11/2026", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e7", nome: "Biscoito Maria", categoria: "Especificações & Condimentos", unidade: "Pct", saldoAtual: 36, dataValidade: "20/11/2026", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e8", nome: "Café", categoria: "Especificações & Condimentos", unidade: "Kg", saldoAtual: 24, dataValidade: "15/12/2026", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e9", nome: "Caldo de Carne", categoria: "Especificações & Condimentos", unidade: "Und", saldoAtual: 20, dataValidade: "08/02/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e10", nome: "Caldo de Galinha", categoria: "Especificações & Condimentos", unidade: "Und", saldoAtual: 25, dataValidade: "08/02/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e11", nome: "Coloral", categoria: "Especificações & Condimentos", unidade: "g", saldoAtual: 1200, dataValidade: "20/04/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e12", nome: "Cominho", categoria: "Especificações & Condimentos", unidade: "g", saldoAtual: 750, dataValidade: "20/04/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e13", nome: "Ervilha", categoria: "Especificações & Condimentos", unidade: "Lata", saldoAtual: 18, dataValidade: "15/06/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e14", nome: "Extrato de Tomate", categoria: "Especificações & Condimentos", unidade: "Kg", saldoAtual: 16, dataValidade: "10/03/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e15", nome: "Folha de Louro", categoria: "Especificações & Condimentos", unidade: "g", saldoAtual: 300, dataValidade: "25/05/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e16", nome: "Leite de Coco", categoria: "Especificações & Condimentos", unidade: "Vidro", saldoAtual: 22, dataValidade: "18/02/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e17", nome: "Milho Verde", categoria: "Especificações & Condimentos", unidade: "Lata", saldoAtual: 20, dataValidade: "12/06/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e18", nome: "Molho Shoyu", categoria: "Especificações & Condimentos", unidade: "Lt", saldoAtual: 5, dataValidade: "05/04/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e19", nome: "Molho Inglês", categoria: "Especificações & Condimentos", unidade: "Vidro", saldoAtual: 6, dataValidade: "05/04/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e20", nome: "Óleo Vegetal", categoria: "Especificações & Condimentos", unidade: "Lt", saldoAtual: 4, dataValidade: "20/01/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e21", nome: "Orégano", categoria: "Especificações & Condimentos", unidade: "g", saldoAtual: 450, dataValidade: "15/04/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e22", nome: "Pimenta do Reino", categoria: "Especificações & Condimentos", unidade: "g", saldoAtual: 600, dataValidade: "15/04/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e23", nome: "Sal", categoria: "Especificações & Condimentos", unidade: "Kg", saldoAtual: 28, dataValidade: "10/08/2027", fornecedorPrincipal: "Distribuidora do Agreste" },
  { id: "e24", nome: "Vinagre", categoria: "Especificações & Condimentos", unidade: "Lt", saldoAtual: 14, dataValidade: "30/03/2027", fornecedorPrincipal: "Distribuidora Bela" },
  { id: "e25", nome: "Azeitona em Conserva", categoria: "Especificações & Condimentos", unidade: "Kg", saldoAtual: 10, dataValidade: "20/02/2027", fornecedorPrincipal: "Distribuidora Bela" },
];

const EXTRATO_INICIAL: MovimentacaoExtrato[] = [
  {
    id: "m1",
    tipo: "SAIDA",
    dataHora: "04/09/2026 13:30",
    origemTurno: "Consumo • Almoço",
    responsavel: "Equipe Cozinha (Maria das Dores e Severina)",
    itensResumo: "Coxa de Frango (45kg), Arroz (30kg), Feijão Macassar (18kg)...",
    detalhesItens: [
      { insumo: "Coxa de Frango", quantidade: 45, unidade: "Kg" },
      { insumo: "Arroz Parboilizado", quantidade: 30, unidade: "Kg" },
      { insumo: "Feijão Macassar", quantidade: 18, unidade: "Kg" },
      { insumo: "Macarrão Espaguete", quantidade: 15, unidade: "Kg" },
      { insumo: "Ovos Pasteurizados", quantidade: 120, unidade: "Und" },
      { insumo: "Tomate", quantidade: 8, unidade: "Kg" },
      { insumo: "Couve", quantidade: 10, unidade: "Maço" },
      { insumo: "Sal", quantidade: 2, unidade: "Kg" },
      { insumo: "Óleo Vegetal", quantidade: 4, unidade: "Lt" },
    ],
    observacao: "Sobra de cerca de 2,5 kg de arroz pronto na bancada. Nenhum descarte de proteína registrado.",
  },
  {
    id: "m2",
    tipo: "ENTRADA",
    dataHora: "04/09/2026 09:15",
    origemTurno: "Recebimento • Hortifrúti",
    responsavel: "Recepção / Cozinha",
    fornecedor: "Produtor Feirante Local (Agricultura Familiar)",
    lote: "HORTI-0409",
    validade: "09/09/2026",
    itensResumo: "Tomate (+25kg), Couve (+20 maços), Beterraba (+15kg)",
    detalhesItens: [
      { insumo: "Tomate", quantidade: 25, unidade: "Kg" },
      { insumo: "Couve", quantidade: 20, unidade: "Maço" },
      { insumo: "Beterraba", quantidade: 15, unidade: "Kg" },
    ],
    observacao: "Carga entregue fresca em caixas plásticas higienizadas. Canhoto assinado.",
    fotoAnexada: "Foto do canhoto/entrega anexada",
  },
  {
    id: "m3",
    tipo: "SAIDA",
    dataHora: "04/09/2026 08:45",
    origemTurno: "Consumo • Café da Manhã",
    responsavel: "Equipe Cozinha (Severina)",
    itensResumo: "Flocão de Milho (20kg), Ovos (80 und), Leite (25 Lt), Café (4kg)",
    detalhesItens: [
      { insumo: "Flocão de Milho (Cuscuz)", quantidade: 20, unidade: "Kg" },
      { insumo: "Ovos Pasteurizados", quantidade: 80, unidade: "Und" },
      { insumo: "Leite in natura", quantidade: 25, unidade: "Lt" },
      { insumo: "Café", quantidade: 4, unidade: "Kg" },
      { insumo: "Açúcar Cristal", quantidade: 6, unidade: "Kg" },
    ],
    observacao: "Sem sobras relevantes. Rendimento dentro do padrão do cardápio matutino.",
  },
  {
    id: "m4",
    tipo: "ENTRADA",
    dataHora: "03/09/2026 14:00",
    origemTurno: "Recebimento • Carnes e Proteínas",
    responsavel: "Nutricionista Hítalo",
    fornecedor: "Avícola Regional Ltda",
    lote: "LT-902",
    validade: "06/09/2026",
    itensResumo: "Coxa de Frango (+60kg), Peito de Frango (+30kg)",
    detalhesItens: [
      { insumo: "Coxa de Frango", quantidade: 60, unidade: "Kg" },
      { insumo: "Peito de Frango", quantidade: 30, unidade: "Kg" },
    ],
    observacao: "Mercadoria congelada recebida a -12°C. Selo SIF conferido visualmente.",
    fotoAnexada: "Foto das caixas e etiquetas de lote",
  },
];

export default function EstoqueGeralPage() {
  const router = useRouter();
  const { autenticado, carregando } = useAuth();

  // Estados da página (permanecem intactos no topo)
  const [abaAtiva, setAbaAtiva] = useState<"inventario" | "registrar" | "extrato">("inventario");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todos");
  const [listaEstoque, setListaEstoque] = useState<ItemEstoque[]>(TODOS_ITENS_ESTOQUE);
  const [extrato, setExtrato] = useState<MovimentacaoExtrato[]>(EXTRATO_INICIAL);

  // Controle de Auditoria Detalhada
  const [itemAuditoriaSelecionado, setItemAuditoriaSelecionado] = useState<MovimentacaoExtrato | null>(null);

  // Formulário da Aba Registrar Entrada (SEM PRÉ-SELEÇÃO)
  const [categoriaEntradaAtiva, setCategoriaEntradaAtiva] = useState<string>("Todos");
  const [buscaEntrada, setBuscaEntrada] = useState("");
  const [buscaEntradaFocada, setBuscaEntradaFocada] = useState(false);
  const [itemEntradaId, setItemEntradaId] = useState<string>("");

  const [fornecedorEntrada, setFornecedorEntrada] = useState("");
  const [quantidadeEntrada, setQuantidadeEntrada] = useState("");
  const [validadeEntrada, setValidadeEntrada] = useState("");
  const [loteEntrada, setLoteEntrada] = useState("");
  const [fotoMercadoria, setFotoMercadoria] = useState<string | null>(null);
  const [sucessoFeedback, setSucessoFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redireciona para /login se não estiver logado como Nutricionista
  useEffect(() => {
    if (!carregando && !autenticado) {
      router.push("/login");
    }
  }, [autenticado, carregando, router]);

  // Intercepta renderização enquanto checa sessão ou se o usuário for não-autorizado
  if (carregando || !autenticado) {
    return null;
  }

  // --- Lógica e funções da página continuam normalmente a partir daqui ---
  const insumoEntradaSelecionado = listaEstoque.find((i) => i.id === itemEntradaId) || null;

  const calcularStatusItem = (item: ItemEstoque): "NORMAL" | "ATENCAO" => {
    const statusSaldo = verificarStatusEstoque(item.saldoAtual, item.unidade, item.categoria);
    const statusValidade = item.diasValidade !== undefined && item.diasValidade <= 5 ? "ATENCAO" : "NORMAL";

    return statusSaldo === "ATENCAO" || statusValidade === "ATENCAO" ? "ATENCAO" : "NORMAL";
  };
 

  // Filtro de inventário geral
  const itensFiltrados = listaEstoque.filter((item) => {
    const bateCategoria =
      categoriaFiltro === "Todos" || item.categoria === categoriaFiltro;
    const bateBusca =
      busca.trim() === "" ||
      item.nome.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });

  // Filtro dos insumos na aba de Registrar Entrada
  const insumosEntradaFiltrados = listaEstoque.filter((item) => {
    const bateCategoria =
      categoriaEntradaAtiva === "Todos" || item.categoria === categoriaEntradaAtiva;
    const bateBusca =
      buscaEntrada.trim() === "" ||
      item.nome.toLowerCase().includes(buscaEntrada.toLowerCase());
    return bateCategoria && bateBusca;
  });

  // Total calculado dinamicamente com base nas regras do estoqueRules
  const totalAtencao = listaEstoque.filter((i) => calcularStatusItem(i) === "ATENCAO").length;

  // TOGGLE: Se clicar no mesmo, desmarca
  const alternarSelecaoInsumo = (item: ItemEstoque) => {
    if (itemEntradaId === item.id) {
      limparSelecao();
    } else {
      setItemEntradaId(item.id);
      setBuscaEntrada(item.nome);
      setBuscaEntradaFocada(false);
      if (!fornecedorEntrada) {
        setFornecedorEntrada(item.fornecedorPrincipal);
      }
    }
  };

  const limparSelecao = () => {
    setItemEntradaId("");
    setBuscaEntrada("");
    setBuscaEntradaFocada(false);
    setQuantidadeEntrada("");
    setFornecedorEntrada("");
    setValidadeEntrada("");
    setLoteEntrada("");
    setFotoMercadoria(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFotoMercadoria(url);
    }
  };

  const removerFoto = () => {
    setFotoMercadoria(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const registrarNovaEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoEntradaSelecionado) return;
    const qtdNum = parseFloat(quantidadeEntrada);
    if (isNaN(qtdNum) || qtdNum <= 0 || !fornecedorEntrada.trim()) return;

    setListaEstoque((prev) =>
      prev.map((i) =>
        i.id === itemEntradaId
          ? {
              ...i,
              saldoAtual: Number((i.saldoAtual + qtdNum).toFixed(2)),
              fornecedorPrincipal: fornecedorEntrada.trim(),
            }
          : i
      )
    );

    const novaMovimentacao: MovimentacaoExtrato = {
      id: Math.random().toString(),
      tipo: "ENTRADA",
      dataHora: "06/09/2026 11:30",
      origemTurno: "Recebimento • Entrada de Insumo",
      responsavel: "Nutricionista Hítalo",
      fornecedor: fornecedorEntrada.trim(),
      validade: validadeEntrada || undefined,
      lote: loteEntrada || undefined,
      itensResumo: `${insumoEntradaSelecionado.nome} (+${qtdNum} ${insumoEntradaSelecionado.unidade})`,
      detalhesItens: [
        {
          insumo: insumoEntradaSelecionado.nome,
          quantidade: qtdNum,
          unidade: insumoEntradaSelecionado.unidade,
        },
      ],
      observacao: "Entrada registrada e conferida pela Nutrição.",
      fotoAnexada: fotoMercadoria || undefined,
    };

    setExtrato((prev) => [novaMovimentacao, ...prev]);
    setSucessoFeedback(true);

    setTimeout(() => {
      setSucessoFeedback(false);
      limparSelecao();
      setAbaAtiva("inventario");
    }, 1200);
  };

  const podeSalvar =
    insumoEntradaSelecionado &&
    fornecedorEntrada.trim().length > 0 &&
    Boolean(quantidadeEntrada) &&
    parseFloat(quantidadeEntrada) > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO PADRÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Entradas & Estoque
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {listaEstoque.length} insumos catalogados • {totalAtencao} itens em atenção de reposição/validade
          </p>
        </div>
      </div>

      {/* 2. ABAS */}
      <div className="flex items-center gap-4 border-b border-slate-200 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setAbaAtiva("inventario")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "inventario"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Inventário ({itensFiltrados.length})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("registrar")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "registrar"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Registrar Entrada
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("extrato")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "extrato"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Histórico de Auditoria ({extrato.length})
        </button>
      </div>

      {/* 3. ABA 1: INVENTÁRIO */}
      {abaAtiva === "inventario" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar insumo..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoriaFiltro === cat
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Saldo Atual</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {itensFiltrados.map((item) => {
                  const statusItem = calcularStatusItem(item);
                  const isAtencao = statusItem === "ATENCAO";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.nome}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {item.categoria}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                        {item.saldoAtual} {item.unidade}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isAtencao ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Atenção
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.dataValidade ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-semibold text-slate-800 text-xs">
                              {item.dataValidade}
                            </span>
                            {item.diasValidade !== undefined && (
                              <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Em {item.diasValidade} dias</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ABA 2: REGISTRAR ENTRADA (SEM DROPDOWN QUANDO SELECIONADO) */}
      {abaAtiva === "registrar" && (
        <div className="w-full space-y-6">
          {sucessoFeedback ? (
            <div className="p-8 text-center space-y-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-base font-extrabold text-slate-900">Entrada Confirmada!</p>
              <p className="text-xs text-slate-500">O saldo foi somado ao inventário e registrado no histórico de auditoria.</p>
            </div>
          ) : (
            <form onSubmit={registrarNovaEntrada} className="w-full space-y-5">
              {/* BLOCO DE BUSCA DINÂMICA E CATEGORIAS */}
              <div className="bg-emerald-50/50 border-2 border-emerald-200/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                    <PackagePlus className="w-5 h-5 text-emerald-600" />
                    <span>Selecionar Insumo e Detalhes ({insumosEntradaFiltrados.length} encontrados)</span>
                  </h2>

                  {/* Badge com botão X para desmarcar */}
                  {insumoEntradaSelecionado && (
                    <div className="flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                      <span>Selecionado: {insumoEntradaSelecionado.nome}</span>
                      <button
                        type="button"
                        onClick={limparSelecao}
                        className="hover:bg-emerald-100 rounded-full p-0.5 text-emerald-700 cursor-pointer"
                        title="Desmarcar seleção"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Filtro por Categorias */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaEntradaAtiva(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        categoriaEntradaAtiva === cat
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Input de Busca com Botão de Limpar */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={buscaEntrada}
                    onFocus={() => setBuscaEntradaFocada(true)}
                    onChange={(e) => {
                      setBuscaEntrada(e.target.value);
                      setBuscaEntradaFocada(true);
                    }}
                    placeholder="Digite o nome do insumo ou escolha abaixo..."
                    className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />

                  {buscaEntrada.length > 0 && (
                    <button
                      type="button"
                      onClick={limparSelecao}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                      title="Limpar busca e seleção"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {buscaEntradaFocada && buscaEntrada.trim().length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border-2 border-emerald-400 rounded-xl shadow-xl z-30 divide-y divide-slate-100">
                      {insumosEntradaFiltrados.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center font-medium">
                          Nenhum insumo encontrado com "{buscaEntrada}"
                        </div>
                      ) : (
                        insumosEntradaFiltrados.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={() => alternarSelecaoInsumo(item)}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between cursor-pointer"
                          >
                            <span>{item.nome}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              {item.categoria} • {item.unidade}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Chips Clicáveis Rápidos (com Toggle para desmarcar) */}
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                  {insumosEntradaFiltrados.map((item) => {
                    const selecionado = itemEntradaId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => alternarSelecaoInsumo(item)}
                        className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selecionado
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-xs scale-105"
                            : "bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50"
                        }`}
                      >
                        <span>{item.nome}</span>
                        {selecionado && <X className="w-3 h-3 text-white/80 hover:text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown de Contingência: Some quando houver um insumo selecionado */}
                {!insumoEntradaSelecionado && (
                  <div className="pt-3 border-t border-emerald-200/80 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold text-emerald-950 uppercase block mb-1">
                      Ou selecione diretamente no seletor completo:
                    </label>
                    <select
                      value={itemEntradaId}
                      onChange={(e) => {
                        const item = listaEstoque.find((i) => i.id === e.target.value);
                        if (item) {
                          alternarSelecaoInsumo(item);
                        } else {
                          limparSelecao();
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="">-- Nenhum insumo selecionado (clique para escolher) --</option>
                      {listaEstoque.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome} ({i.categoria} • {i.unidade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* BLOCO DE DADOS DA ENTRADA - HABILITADO APENAS APÓS SELEÇÃO */}
              {insumoEntradaSelecionado ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      Dados do Recebimento: {insumoEntradaSelecionado.nome}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      Unidade de medida: <strong className="text-emerald-700">{insumoEntradaSelecionado.unidade}</strong>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Fornecedor / Origem da Entrega *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fornecedorEntrada}
                      onChange={(e) => setFornecedorEntrada(e.target.value)}
                      placeholder="Ex.: Distribuidora Bela, Feirante Local, Cooperativa..."
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Quantidade Recebida ({insumoEntradaSelecionado.unidade}) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={quantidadeEntrada}
                      onChange={(e) => setQuantidadeEntrada(e.target.value)}
                      placeholder="Ex.: 30"
                      className="w-full p-2.5 border-2 border-slate-300 rounded-xl text-sm sm:text-base font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Data de Validade <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                      </label>
                      <input
                        type="date"
                        value={validadeEntrada}
                        onChange={(e) => setValidadeEntrada(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Número do Lote <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={loteEntrada}
                        onChange={(e) => setLoteEntrada(e.target.value)}
                        placeholder="LT-2026"
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Foto da Mercadoria ou Canhoto */}
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Foto do Produto / Canhoto de Entrega (Opcional)</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50/50 transition-colors">
                      {fotoMercadoria ? (
                        <div className="flex items-center justify-between text-xs text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            <span>Foto anexada com sucesso</span>
                          </div>
                          <button
                            type="button"
                            onClick={removerFoto}
                            className="text-slate-400 hover:text-slate-700 underline font-normal cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer space-y-1 block">
                          <Upload className="w-6 h-6 mx-auto text-slate-400" />
                          <p className="text-xs font-semibold text-slate-700">
                            Fotografar os produtos descarregados ou canhoto
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={() => setFotoMercadoria("foto-mercadoria-recebida.jpg")}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={limparSelecao}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Desmarcar / Limpar
                    </button>

                    <button
                      type="submit"
                      disabled={!podeSalvar}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Entrada no Estoque</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200/80 rounded-xl">
                  Selecione um insumo acima para abrir os campos de registro (fornecedor, quantidade e validade).
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* 5. ABA 3: HISTÓRICO COM VISUALIZAÇÃO AUDITÁVEL DETALHADA */}
      {abaAtiva === "extrato" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase text-slate-600 tracking-wide">
              Registros Cronológicos de Movimentação
            </span>
            <span className="text-xs text-slate-400">
              Clique em qualquer registro para auditar os insumos lançados
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
            {extrato.map((mov) => {
              const isEntrada = mov.tipo === "ENTRADA";

              return (
                <div
                  key={mov.id}
                  onClick={() => setItemAuditoriaSelecionado(mov)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors text-xs sm:text-sm cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isEntrada
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isEntrada ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 truncate">
                          {mov.origemTurno}
                        </p>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            isEntrada
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isEntrada ? "ENTRADA" : "SAÍDA"}
                        </span>
                      </div>

                      <p className="text-slate-500 text-xs truncate">
                        {mov.itensResumo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
                      {mov.dataHora}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 group-hover:text-emerald-700 group-hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Auditar detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. MODAL DE AUDITORIA DO REGISTRO */}
      {itemAuditoriaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    itemAuditoriaSelecionado.tipo === "ENTRADA"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Ficha de Auditoria do Lançamento
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ID: {itemAuditoriaSelecionado.id} • {itemAuditoriaSelecionado.dataHora}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setItemAuditoriaSelecionado(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadados Técnicos */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Tipo / Turno
                </span>
                <span className="font-extrabold text-slate-800">
                  {itemAuditoriaSelecionado.origemTurno}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Responsável
                </span>
                <span className="font-semibold text-slate-800">
                  {itemAuditoriaSelecionado.responsavel}
                </span>
              </div>

              {itemAuditoriaSelecionado.fornecedor && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Fornecedor / Origem
                  </span>
                  <span className="font-medium text-slate-700">
                    {itemAuditoriaSelecionado.fornecedor}
                  </span>
                </div>
              )}

              {itemAuditoriaSelecionado.lote && (
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Lote / Validade
                  </span>
                  <span className="font-medium text-slate-700">
                    {itemAuditoriaSelecionado.lote}{" "}
                    {itemAuditoriaSelecionado.validade && `(Val: ${itemAuditoriaSelecionado.validade})`}
                  </span>
                </div>
              )}
            </div>

            {/* Tabela de Insumos */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                Discriminação dos Insumos Lançados
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {itemAuditoriaSelecionado.detalhesItens.map((det, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium">{det.insumo}</td>
                        <td className="px-3 py-2 text-right font-extrabold text-slate-900">
                          {det.quantidade} {det.unidade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observações */}
            {itemAuditoriaSelecionado.observacao && (
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                  Declarações e Ocorrências da Cozinha
                </span>
                <p className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl leading-relaxed">
                  {itemAuditoriaSelecionado.observacao}
                </p>
              </div>
            )}

            {/* Foto anexada */}
            {itemAuditoriaSelecionado.fotoAnexada && (
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Foto Anexada da Mercadoria/Canhoto</span>
                </span>
                <span className="text-emerald-700 font-bold">
                  {itemAuditoriaSelecionado.fotoAnexada}
                </span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setItemAuditoriaSelecionado(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}