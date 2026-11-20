import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/app/components/Sidebar";
import SeletorRefeicao, { obterRefeicaoPorHorario } from "@/app/components/SeletorRefeicao";
import CardapioCard from "@/app/components/CardapioCard";

const mockLogout = vi.fn();
const mockSetMenuMobileAberto = vi.fn();
let mockAuthValues = {
  perfil: "NUTRICIONISTA" as "ADMIN" | "COZINHA" | "NUTRICIONISTA",
  logout: mockLogout,
  menuMobileAberto: false,
  setMenuMobileAberto: mockSetMenuMobileAberto,
  totalAlertasPendentes: 0,
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/consumo",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/app/context/AuthContext", () => ({
  useAuth: () => mockAuthValues,
}));

describe("Componente Sidebar e controle de acesso por perfil (RBAC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthValues = {
      perfil: "NUTRICIONISTA",
      logout: mockLogout,
      menuMobileAberto: false,
      setMenuMobileAberto: mockSetMenuMobileAberto,
      totalAlertasPendentes: 0,
    };
  });

  it("renderiza exclusivamente Gestão de Usuários para o perfil ADMIN", () => {
    mockAuthValues.perfil = "ADMIN";
    render(<Sidebar />);

    expect(screen.getByText("Gestão de Usuários")).toBeInTheDocument();
    expect(screen.queryByText("Consumo Diário")).not.toBeInTheDocument();
    expect(screen.queryByText("Entradas & Estoque")).not.toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });

  it("renderiza apenas links operacionais para o perfil COZINHA e exibe badge de alertas", () => {
    mockAuthValues.perfil = "COZINHA";
    mockAuthValues.totalAlertasPendentes = 4;
    mockAuthValues.menuMobileAberto = true;
    render(<Sidebar />);

    expect(screen.getByText("Consumo Diário")).toBeInTheDocument();
    expect(screen.getByText("Central de Alertas")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.queryByText("Entradas & Estoque")).not.toBeInTheDocument();
    expect(screen.queryByText("Gestão de Usuários")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Fechar menu"));
    expect(mockSetMenuMobileAberto).toHaveBeenCalledWith(false);
  });

  it("renderiza todos os módulos para o perfil NUTRICIONISTA e aciona logout", () => {
    mockAuthValues.perfil = "NUTRICIONISTA";
    render(<Sidebar />);

    expect(screen.getByText("Consumo Diário")).toBeInTheDocument();
    expect(screen.getByText("Entradas & Estoque")).toBeInTheDocument();
    expect(screen.getByText("Notas Fiscais")).toBeInTheDocument();
    expect(screen.getByText("Cardápio Semanal")).toBeInTheDocument();
    expect(screen.getByText("Transmissão TV")).toBeInTheDocument();
    expect(screen.getByText("Relatórios & Indicadores")).toBeInTheDocument();
    expect(screen.getByText("Central de Alertas")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Encerrar Sessão"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

describe("Componente SeletorRefeicao", () => {
  it("alterna entre Café da Manhã, Almoço e Jantar ao clicar", () => {
    const onChange = vi.fn();
    render(<SeletorRefeicao valor="Almoço" onChange={onChange} />);

    fireEvent.click(screen.getByText("Café"));
    expect(onChange).toHaveBeenCalledWith("Café da Manhã");

    fireEvent.click(screen.getByText("Jantar"));
    expect(onChange).toHaveBeenCalledWith("Jantar");
  });

  it("calcula a refeição sugerida conforme o horário do sistema", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-11-14T08:00:00"));
    expect(obterRefeicaoPorHorario()).toBe("Café da Manhã");

    vi.setSystemTime(new Date("2026-11-14T12:30:00"));
    expect(obterRefeicaoPorHorario()).toBe("Almoço");

    vi.setSystemTime(new Date("2026-11-14T19:00:00"));
    expect(obterRefeicaoPorHorario()).toBe("Jantar");

    vi.useRealTimers();
  });
});

describe("Componente CardapioCard", () => {
  it("exibe mensagem padrão quando não há cardápio cadastrado", () => {
    render(
      <CardapioCard
        refeicao="Almoço"
        descricao="Nenhum cardápio cadastrado"
        modoFixo
      />
    );
    expect(
      screen.getByText("Nenhum cardápio cadastrado para esta refeição.")
    ).toBeInTheDocument();
  });

  it("renderiza itens estruturados, salada e observações no modo fixo", () => {
    render(
      <CardapioCard
        refeicao="Almoço"
        descricao=""
        modoFixo
        dadosRefeicao={{
          itens: [{ id: "1", nome: "Frango Grelhado", quantidade: "15kg" }],
          itensSalada: [{ id: "2", nome: "Alface e Tomate", quantidade: "5kg" }],
          observacoes: "Sem lactose na opção vegetariana",
        }}
      />
    );

    expect(screen.getByText("Frango Grelhado")).toBeInTheDocument();
    expect(screen.getByText("15kg")).toBeInTheDocument();
    expect(screen.getByText("Salada: Alface e Tomate")).toBeInTheDocument();
    expect(
      screen.getByText("Sem lactose na opção vegetariana")
    ).toBeInTheDocument();
  });

  it("normaliza cardápio a partir de texto livre e dados legados no modo padrão", () => {
    const { rerender } = render(
      <CardapioCard
        refeicao="Jantar"
        descricao=""
        responsavel="Dra. Camila"
        dadosRefeicao={{
          texto: "- Cuscuz (10kg)\n- Ovos mexidos (5kg)",
        }}
      />
    );

    expect(screen.getByText("Dra. Camila")).toBeInTheDocument();
    expect(screen.getByText("Cuscuz")).toBeInTheDocument();
    expect(screen.getByText("(10kg)")).toBeInTheDocument();

    rerender(
      <CardapioCard
        refeicao="Café da Manhã"
        descricao=""
        dadosRefeicao={{
          pratoPrincipal: "Pão com queijo",
          bebida: "Café com leite",
        }}
      />
    );

    expect(screen.getByText("Pão com queijo")).toBeInTheDocument();
    expect(screen.getByText("Bebida: Café com leite")).toBeInTheDocument();
  });
});

