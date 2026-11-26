import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EstoqueGeralPage from "@/app/(nutri)/estoque/page";
import ConsumoDiarioPage, {
  formatarDataBr,
  calcularValidadeFEFO,
  obterUnidadesDisponiveis,
  converterParaUnidadeBase,
  obterPassoIncremento,
  obterPassosRapidos,
} from "@/app/consumo/page";
import { produtoService, ProdutoResponse } from "@/lib/produtos";
import * as movApi from "@/lib/movimentacoes";
import * as locaisApi from "@/lib/locais";
import * as authSession from "@/lib/authSession";

const mockPush = vi.fn();
let mockAuthState = {
  autenticado: true,
  carregando: false,
  perfil: "NUTRICIONISTA" as "ADMIN" | "NUTRICIONISTA" | "COZINHA",
  usuario: {
    nome: "Raphaela Nutri",
    email: "nutri@ifpe.edu.br",
    perfil: "NUTRICIONISTA" as const,
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/estoque",
}));

vi.mock("@/app/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || "imagem"} />
  ),
}));

const produtosMock: ProdutoResponse[] = [
  {
    id: "prod-1",
    nome: "Arroz Parboilizado",
    categoria: "Grãos & Cereais",
    unidadeMedida: "Kg",
    valorReferencia: 6.5,
    quantidadeMinima: 20,
    controlaValidade: true,
    saldoTotal: 50,
  },
  {
    id: "prod-2",
    nome: "Frango Congelado",
    categoria: "Proteínas & Frios",
    unidadeMedida: "Kg",
    valorReferencia: 14.0,
    quantidadeMinima: 30,
    controlaValidade: true,
    saldoTotal: 0,
  },
];

const locaisMock = [
  { id: "loc-despensa", nome: "Despensa" },
  { id: "loc-congelados", nome: "Congelados/Refrigerados" },
];

describe("Telas de Estoque e Consumo Diário (#505)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthState = {
      autenticado: true,
      carregando: false,
      perfil: "NUTRICIONISTA",
      usuario: {
        nome: "Raphaela Nutri",
        email: "nutri@ifpe.edu.br",
        perfil: "NUTRICIONISTA",
      },
    };

    vi.spyOn(authSession, "getToken").mockReturnValue("token-mock");
    vi.spyOn(produtoService, "listar").mockResolvedValue(produtosMock);
    vi.spyOn(produtoService, "cadastrar").mockResolvedValue({
      id: "prod-3",
      nome: "Feijão Carioca",
      categoria: "Grãos & Cereais",
      unidadeMedida: "Kg",
      saldoTotal: 0,
    });
    vi.spyOn(produtoService, "atualizarUnidadeMedida").mockResolvedValue(produtosMock[0]);
    vi.spyOn(produtoService, "atualizarQuantidadeMinima").mockResolvedValue(produtosMock[0]);
    vi.spyOn(produtoService, "atualizarValorReferencia").mockResolvedValue(produtosMock[0]);
    vi.spyOn(produtoService, "atualizarControleValidade").mockResolvedValue(produtosMock[0]);
    vi.spyOn(produtoService, "excluir").mockResolvedValue();

    vi.spyOn(locaisApi, "listarLocaisArmazenamento").mockResolvedValue(locaisMock);
    vi.spyOn(movApi, "listarHistoricoApi").mockResolvedValue([
      {
        id: "mov-1",
        produtoId: "prod-1",
        produtoNome: "Arroz Parboilizado",
        localId: "loc-despensa",
        localNome: "Despensa",
        tipo: "ENTRADA",
        quantidade: 50,
        data: "2026-11-20",
        origem: "EXTERNA",
        valor: 325,
        fornecedor: "Atacadão IFPE",
        lote: "LT-01",
        dataValidade: "2027-01-15",
      },
    ]);
    vi.spyOn(movApi, "registrarEntradaApi").mockResolvedValue({
      id: "mov-2",
      produtoId: "prod-1",
      localId: "loc-despensa",
      tipo: "ENTRADA",
      quantidade: 10,
      data: "2026-11-25",
      origem: "EXTERNA",
      valor: 65,
    });
    vi.spyOn(movApi, "registrarSaidaApi").mockResolvedValue({
      id: "mov-3",
      produtoId: "prod-1",
      localId: "loc-despensa",
      tipo: "SAIDA",
      quantidade: 2,
      data: "2026-11-25",
      origem: "INTERNA",
      valor: 0,
    });
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(null), { status: 200 })
    );
  });

  it("renderiza EstoqueGeralPage, filtra catálogo, cadastra/edita insumo e consulta extrato", async () => {
    render(<EstoqueGeralPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Arroz Parboilizado").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Frango Congelado").length).toBeGreaterThan(0);
    });

    // Busca no catálogo e filtro por categoria
    fireEvent.change(
      screen.getByPlaceholderText(/Buscar insumo/i),
      { target: { value: "Arroz" } }
    );
    expect(screen.getAllByText("Arroz Parboilizado").length).toBeGreaterThan(0);
    expect(screen.queryByText("Frango Congelado")).not.toBeInTheDocument();
    fireEvent.change(
      screen.getByPlaceholderText(/Buscar insumo/i),
      { target: { value: "" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Grãos & Cereais" }));
    fireEvent.click(screen.getByRole("button", { name: "Todos" }));

    // Abrir modal Novo Insumo, marcar entrada inicial e cadastrar
    fireEvent.click(screen.getByRole("button", { name: /Novo Insumo/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/Carne de Porco, Arroz Parboilizado/i),
      { target: { value: "Feijão Carioca" } }
    );
    const checkboxEntradaInicial = screen
      .getByText(/Dar Entrada Inicial no Estoque/i)
      .closest("label")
      ?.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (checkboxEntradaInicial) {
      fireEvent.click(checkboxEntradaInicial);
      fireEvent.change(screen.getByPlaceholderText("Ex: 50"), {
        target: { value: "20" },
      });
    }
    fireEvent.submit(
      screen.getByRole("button", { name: /Cadastrar Insumo/i }).closest("form")!
    );

    await waitFor(() => {
      expect(produtoService.cadastrar).toHaveBeenCalled();
    });

    // Abrir modal de edição de parâmetros do primeiro insumo
    const botoesEditar = screen.getAllByTitle("Editar parâmetros do insumo");
    fireEvent.click(botoesEditar[0]);
    expect(screen.getByText("Editar Parâmetros")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Ex: 10"), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ex: 25.00"), {
      target: { value: "12.50" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /Salvar Alterações/i }).closest("form")!
    );
    await waitFor(() => {
      expect(screen.queryByText("Editar Parâmetros")).not.toBeInTheDocument();
    });

    // Abrir modal de exclusão para o item zerado (Frango Congelado)
    fireEvent.click(botoesEditar[1]);
    fireEvent.click(screen.getByRole("button", { name: /Excluir Insumo/i }));
    expect(screen.getByText("Confirmar Exclusão")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Exclusão/i }));
    await waitFor(() => {
      expect(produtoService.excluir).toHaveBeenCalledWith("prod-2");
    });

    // Navegar para aba Registrar Entrada
    fireEvent.click(screen.getByRole("button", { name: /Registrar Entrada/i }));
    const inputBuscaEntrada = screen.getByPlaceholderText(/Digite o nome do insumo/i);
    fireEvent.focus(inputBuscaEntrada);
    fireEvent.click(screen.getAllByText("Arroz Parboilizado")[0]);
    fireEvent.click(screen.getByTitle("Trocar insumo selecionado"));
    fireEvent.change(screen.getByPlaceholderText(/Digite o nome do insumo/i), {
      target: { value: "Arroz" },
    });
    fireEvent.click(screen.getByTitle("Limpar campo"));
    fireEvent.focus(screen.getByPlaceholderText(/Digite o nome do insumo/i));
    fireEvent.click(screen.getAllByText("Arroz Parboilizado")[0]);
    fireEvent.click(
      screen.getByTitle("Editar parâmetros, unidade ou preço deste insumo")
    );
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/Fazenda IFPE, Distribuidora/i),
      { target: { value: "Cooperativa Agrícola" } }
    );
    fireEvent.change(screen.getByPlaceholderText("Ex.: 30"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ex: LT-2026-04"), {
      target: { value: "LT-2026-99" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Entrada no Estoque/i }));

    await waitFor(() => {
      expect(movApi.registrarEntradaApi).toHaveBeenCalledWith(
        expect.objectContaining({
          produtoId: "prod-1",
          localId: "loc-despensa",
          quantidade: 10,
        }),
        null
      );
    });

    // Navegar para aba Histórico de Auditoria e abrir Ficha de Auditoria
    fireEvent.click(screen.getByRole("button", { name: /Histórico de Auditoria/i }));
    await waitFor(() => {
      expect(screen.getByText("Atacadão IFPE")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Atacadão IFPE"));
    expect(screen.getByText("Ficha de Auditoria")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Fechar Ficha/i }));
  });

  it("calcula helpers de data e FEFO e registra saída no ConsumoDiarioPage", async () => {
    expect(formatarDataBr("2026-11-25")).toBe("25/11/2026");
    expect(formatarDataBr()).toBe("");
    const fefo = calcularValidadeFEFO("prod-1", [
      {
        id: "m1",
        produtoId: "prod-1",
        localId: "loc-1",
        tipo: "ENTRADA",
        quantidade: 10,
        data: "2026-11-20",
        origem: "EXTERNA",
        valor: 50,
        dataValidade: "2026-11-27",
      },
    ]);
    expect(fefo.totalLotesComValidade).toBe(1);

    // Testa cenários VENCIDO e CRITICA no helper FEFO
    const hojeStr = new Date().toISOString().split("T")[0];
    const fefoCritico = calcularValidadeFEFO("prod-x", [
      {
        id: "m2",
        produtoId: "prod-x",
        localId: "loc-1",
        tipo: "ENTRADA",
        quantidade: 5,
        data: hojeStr,
        origem: "EXTERNA",
        valor: 20,
        dataValidade: hojeStr,
      },
      {
        id: "m3",
        produtoId: "prod-x",
        localId: "loc-1",
        tipo: "ENTRADA",
        quantidade: 5,
        data: "2020-01-01",
        origem: "EXTERNA",
        valor: 20,
        dataValidade: "2020-01-10",
      },
    ]);
    expect(fefoCritico.statusValidade).toBe("CRITICA");

    expect(obterUnidadesDisponiveis("Kg")).toContain("g");
    expect(obterUnidadesDisponiveis("Litro")).toContain("ml");
    expect(converterParaUnidadeBase(500, "g", "Kg")).toBe(0.5);
    expect(converterParaUnidadeBase(1, "Kg", "g")).toBe(1000);
    expect(converterParaUnidadeBase(500, "ml", "L")).toBe(0.5);
    expect(converterParaUnidadeBase(2, "L", "ml")).toBe(2000);
    expect(obterPassoIncremento("g")).toBe(50);
    expect(obterPassoIncremento("Unidade")).toBe(1);
    expect(obterPassosRapidos("Kg").length).toBeGreaterThan(0);
    expect(obterPassosRapidos("g").length).toBeGreaterThan(0);
    expect(obterPassosRapidos("Unidade").length).toBeGreaterThan(0);

    // Cardápio salvo no localStorage para exercitar matching de insumos planejados
    const diaCardapio = {
      almoco: {
        texto: "- Arroz Parboilizado (10 kg)\n- Frango Congelado (5 kg)",
      },
      cafe: { texto: "- Pão (2 kg)" },
      jantar: { texto: "- Sopa (3 L)" },
    };
    localStorage.setItem(
      "@gestao_refeitorio:cardapio_semanal",
      JSON.stringify({
        Segunda: diaCardapio,
        Terça: diaCardapio,
        Quarta: diaCardapio,
        Quinta: diaCardapio,
        Sexta: diaCardapio,
      })
    );

    mockAuthState.perfil = "COZINHA";
    render(<ConsumoDiarioPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Arroz Parboilizado").length).toBeGreaterThan(0);
    });

    // Alternar data, refeição, unidade e quantidade direta
    const inputData = document.querySelector('input[type="date"]') as HTMLInputElement | null;
    if (inputData) {
      fireEvent.change(inputData, { target: { value: "2026-11-23" } });
    }
    fireEvent.click(screen.getByRole("button", { name: /Café/i }));
    fireEvent.click(screen.getByRole("button", { name: /Jantar/i }));
    fireEvent.click(screen.getByRole("button", { name: /Almoço/i }));
    const selectsUnidade = screen.queryAllByRole("combobox");
    if (selectsUnidade.length > 0) {
      fireEvent.change(selectsUnidade[0], { target: { value: "g" } });
      fireEvent.change(selectsUnidade[0], { target: { value: "Kg" } });
    }
    const inputsQtd = screen.getAllByPlaceholderText("0");
    if (inputsQtd.length > 0) {
      fireEvent.change(inputsQtd[0], { target: { value: "1.5" } });
    }

    // Busca, toggle de ocultar sem estoque, incremento/decremento, observação e limpeza
    fireEvent.change(screen.getByPlaceholderText("Buscar insumo..."), {
      target: { value: "Arroz" },
    });
    fireEvent.click(screen.getByTitle("Ocultar insumos sem estoque"));
    fireEvent.click(screen.getByTitle("Ocultar insumos sem estoque"));
    fireEvent.change(screen.getByPlaceholderText("Buscar insumo..."), {
      target: { value: "" },
    });

    // Incrementa, decrementa, limpa e volta a incrementar quantidade do item com estoque
    const botoesMais = screen.getAllByTitle(/^Aumentar/i);
    fireEvent.click(botoesMais[0]);
    // Clica nos botões de passo rápido (+1kg, +5kg, etc.) se presentes
    const botoesPassoRapido = screen.queryAllByRole("button", { name: /^\+/ });
    botoesPassoRapido.forEach((btn) => fireEvent.click(btn));
    const botoesMenos = screen.getAllByTitle(/^Diminuir/i);
    fireEvent.click(botoesMenos[0]);
    fireEvent.click(botoesMais[0]);
    const botoesZerar = screen.getAllByTitle(/Limpar lançamento/i);
    fireEvent.click(botoesZerar[0]);
    fireEvent.click(botoesMais[0]);
    const btnLimparTudo = screen.queryByRole("button", { name: /^Limpar$/i });
    if (btnLimparTudo) {
      fireEvent.click(btnLimparTudo);
      fireEvent.click(botoesMais[0]);
    }

    const obsInput = screen.getByPlaceholderText(/Sobra de 3kg/i);
    fireEvent.change(obsInput, { target: { value: "Consumo do almoço" } });

    fireEvent.click(screen.getByRole("button", { name: /Registrar Consumo/i }));

    await waitFor(() => {
      expect(movApi.registrarSaidaApi).toHaveBeenCalledWith(
        expect.objectContaining({
          produtoId: "prod-1",
          localId: "loc-despensa",
          tipoSaida: "CONSUMO",
        })
      );
    });
  });
});
