import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CardapioSemanalPage, {
  converterParaItensLinha,
  converterParaItensLinhaSalada,
  extrairTextoRefeicao,
  limparQuantidadesParaRefeitorio,
  parseTextoParaItens,
} from "@/app/cardapio/page";
import RelatoriosPage from "@/app/(nutri)/relatorios/page";
import * as relatoriosApi from "@/lib/relatorios";

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
  usePathname: () => "/cardapio",
}));

vi.mock("@/app/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

describe("Telas de Cardápio Semanal e Relatórios (#505)", () => {
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
  });

  it("converte e limpa textos e itens do Cardápio Semanal", () => {
    const itens = converterParaItensLinha({
      pratoPrincipal: "Frango Assado",
      acompanhamentos: "Arroz e Feijão",
      saladaSobremesa: "Alface",
      bebida: "Suco",
      insumosPlanejados: [
        { produtoId: "p1", nome: "Frango", unidadeMedida: "Kg", quantidadeTotal: 15 },
      ],
    });
    expect(itens.length).toBeGreaterThanOrEqual(4);
    expect(converterParaItensLinhaSalada({ itensSalada: [{ id: "1", nome: "Tomate" }] })).toHaveLength(1);
    expect(
      limparQuantidadesParaRefeitorio("- Cuscuz (10 kg) - Ovos 30 un")
    ).toBe("- Cuscuz - Ovos");

    const parsed = parseTextoParaItens("Salada: Alface + Tomate (2 kg)\n- Arroz (10 kg)");
    expect(parsed.itensSalada).toHaveLength(2);
    expect(parsed.itens).toHaveLength(1);
    expect(extrairTextoRefeicao({ itens: parsed.itens, itensSalada: parsed.itensSalada })).toContain("Salada:");
  });

  it("edita, valida duplicidade, salva e limpa a grade no CardapioSemanalPage", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(null), { status: 200 })
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<CardapioSemanalPage />);

    expect(screen.getByText("Cardápio Semanal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Editar Cardápio/i }));
    const textareas = screen.getAllByPlaceholderText(/Digite os itens do cardápio/i);

    // Tentar salvar com item duplicado na mesma refeição
    fireEvent.change(textareas[0], {
      target: { value: "- Cuscuz (10 kg)\n- Cuscuz (5 kg)" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Item duplicado/i);

    // Corrigir e salvar
    fireEvent.change(textareas[0], {
      target: { value: "- Cuscuz (10 kg)\n- Ovos mexidos (5 kg)" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(screen.getByText("Cardápio salvo com sucesso!")).toBeInTheDocument();
    });

    // Limpar Grade e navegar entre dias
    fireEvent.click(screen.getByRole("button", { name: /Editar Cardápio/i }));
    fireEvent.click(screen.getByRole("button", { name: /Limpar Grade/i }));
    const botoesTer = screen.queryAllByRole("button", { name: /Terça/i });
    if (botoesTer.length > 0) fireEvent.click(botoesTer[0]);
    const botoesHoje = screen.queryAllByRole("button", { name: /Hoje/i });
    if (botoesHoje.length > 0) fireEvent.click(botoesHoje[0]);
  });

  it("carrega KPIs, alterna períodos e exporta PDF e Excel no RelatoriosPage", async () => {
    vi.spyOn(relatoriosApi, "buscarRelatorioMensal").mockResolvedValue([
      {
        produtoId: "p1",
        produtoNome: "Carne Bovina",
        quantidadeEntradas: 40,
        quantidadeSaidas: 25,
        quantidadeProducaoInterna: 0,
        valorEntradas: 1200,
        saldoFinal: 15,
      },
      {
        produtoId: "p2",
        produtoNome: "Arroz Branco",
        quantidadeEntradas: 60,
        quantidadeSaidas: 30,
        quantidadeProducaoInterna: 0,
        valorEntradas: 300,
        saldoFinal: 30,
      },
    ]);
    vi.spyOn(relatoriosApi, "buscarGraficoConsumo").mockResolvedValue([
      { data: "2026-11-10", quantidade: 15 },
      { data: "2026-11-11", quantidade: 25 },
    ]);
    vi.spyOn(relatoriosApi, "exportarRelatorioPdf").mockResolvedValue();
    vi.spyOn(relatoriosApi, "exportarRelatorioExcel").mockResolvedValue();

    render(<RelatoriosPage />);

    await waitFor(() => {
      expect(screen.getByText("Relatórios & Indicadores")).toBeInTheDocument();
      expect(screen.getAllByText("Carne Bovina").length).toBeGreaterThan(0);
    });

    // Navegar entre meses, anos e modo personalizado
    fireEvent.click(screen.getByTitle("Mês anterior"));
    fireEvent.click(screen.getByTitle("Próximo mês"));
    fireEvent.click(screen.getByRole("button", { name: "Anual" }));
    fireEvent.click(screen.getByTitle("Ano anterior"));
    fireEvent.click(screen.getByTitle("Próximo ano"));
    const selectAno = screen.getByDisplayValue(/Ano 2026/i);
    fireEvent.change(selectAno, { target: { value: "2025" } });
    fireEvent.click(screen.getByRole("button", { name: "Personalizado" }));
    const dataInicio = document.getElementById("data-inicio") as HTMLInputElement | null;
    const dataFim = document.getElementById("data-fim") as HTMLInputElement | null;
    if (dataInicio && dataFim) {
      fireEvent.change(dataInicio, { target: { value: "2026-11-01" } });
      fireEvent.change(dataFim, { target: { value: "2026-11-30" } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Mensal" }));

    // Interagir com barras/cards de categoria
    const barrasCategoria = document.querySelectorAll('[title*="% (R$"]');
    if (barrasCategoria.length > 0) {
      fireEvent.mouseEnter(barrasCategoria[0]);
      fireEvent.click(barrasCategoria[0]);
      fireEvent.mouseLeave(barrasCategoria[0]);
    }

    // Exportar PDF e Excel
    fireEvent.click(screen.getByTitle("Exportar relatório em PDF"));
    await waitFor(() => {
      expect(relatoriosApi.exportarRelatorioPdf).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByTitle("Exportar relatório em Excel"));
    await waitFor(() => {
      expect(relatoriosApi.exportarRelatorioExcel).toHaveBeenCalled();
    });
  });
});
