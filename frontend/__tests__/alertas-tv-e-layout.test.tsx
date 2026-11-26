import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextRequest } from "next/server";
import CentralAlertasPage from "@/app/alertas/page";
import CardapioTvPage from "@/app/cardapio-tv/page";
import TvMuralPage from "@/app/tv/page";
import TvRefeitorioPage from "@/app/tv/refeitorio/page";
import LoginPageRedirect from "@/app/(auth)/login/page";
import RootLayout from "@/app/layout";
import { GET as getCardapioApi, POST as postCardapioApi } from "@/app/api/cardapio-semanal/route";
import { produtoService } from "@/lib/produtos";
import * as movApi from "@/lib/movimentacoes";

const mockReplace = vi.fn();
const mockSetTotalAlertasPendentes = vi.fn();
let mockPathname = "/alertas";
const mockAuthState = {
  autenticado: true,
  carregando: false,
  perfil: "NUTRICIONISTA" as "ADMIN" | "NUTRICIONISTA" | "COZINHA",
  usuario: {
    nome: "Raphaela Nutri",
    email: "nutri@ifpe.edu.br",
    perfil: "NUTRICIONISTA" as const,
  },
  token: "token-mock",
  menuMobileAberto: false,
  setMenuMobileAberto: vi.fn(),
  totalAlertasPendentes: 2,
  setTotalAlertasPendentes: mockSetTotalAlertasPendentes,
  bannerAlertasVisivel: true,
  versaoApp: "0.20.0",
  loginComGoogle: vi.fn(),
  loginComCredenciais: vi.fn(),
  logout: vi.fn(),
  toggleMenuMobile: vi.fn(),
  fecharMenuMobile: vi.fn(),
  dispensarBannerAlertas: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
}));

vi.mock("@/app/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthState,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || "imagem"} />
  ),
}));

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("Telas de Alertas, TVs, Login Redirect, Layout e API local (#505)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockPathname = "/alertas";
    mockAuthState.autenticado = true;
    mockAuthState.perfil = "NUTRICIONISTA";
  });

  it("renderiza CentralAlertasPage com alertas de estoque e validade e aplica filtros", async () => {
    const hoje = new Date();
    const emDoisDias = new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dataProx = `${emDoisDias.getFullYear()}-${String(emDoisDias.getMonth() + 1).padStart(2, "0")}-${String(emDoisDias.getDate()).padStart(2, "0")}`;

    vi.spyOn(produtoService, "listar").mockResolvedValue([
      {
        id: "p1",
        nome: "Açúcar Cristal",
        categoria: "Grãos & Cereais",
        unidadeMedida: "Kg",
        saldoTotal: 0,
        quantidadeMinima: 15,
      },
      {
        id: "p2",
        nome: "Iogurte Natural",
        categoria: "Laticínios",
        unidadeMedida: "Lt",
        saldoTotal: 5,
        quantidadeMinima: 20,
      },
    ]);
    vi.spyOn(movApi, "listarHistoricoApi").mockResolvedValue([
      {
        id: "m1",
        produtoId: "p2",
        localId: "loc-1",
        tipo: "ENTRADA",
        quantidade: 5,
        data: "2026-11-20",
        origem: "EXTERNA",
        valor: 30,
        dataValidade: dataProx,
        lote: "LT-IOG",
      },
      {
        id: "m2",
        produtoId: "p2",
        localId: "loc-1",
        tipo: "ENTRADA",
        quantidade: 4,
        data: "2026-11-21",
        origem: "EXTERNA",
        valor: 24,
        dataValidade: dataProx,
        lote: "LT-IOG-2",
      },
    ]);

    render(<CentralAlertasPage />);

    await waitFor(() => {
      expect(screen.getByText("Central de Alertas")).toBeInTheDocument();
      expect(screen.getByText("Açúcar Cristal")).toBeInTheDocument();
      expect(screen.getAllByText("Iogurte Natural").length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByPlaceholderText(/Filtrar por nome do insumo/i), {
      target: { value: "Açúcar" },
    });
    expect(screen.getByText("Açúcar Cristal")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Filtrar por nome do insumo/i), {
      target: { value: "" },
    });

    // Expandir e ocultar múltiplos lotes
    const btnVerLotes = screen.queryByRole("button", {
      name: /Ver todos os lotes/i,
    });
    if (btnVerLotes) {
      fireEvent.click(btnVerLotes);
      fireEvent.click(
        screen.getByRole("button", { name: /Ocultar lotes e vencimentos/i })
      );
    }

    // Alternar filtros de alerta (cards KPI e pills) e atualizar dados
    fireEvent.click(screen.getAllByRole("button", { name: /Estoque Zerado/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Estoque Baixo/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Validade Próxima/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Vencidos/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /^Todos/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Atualizar/i }));
  });

  it("renderiza CardapioTvPage, TvMuralPage (/tv) e TvRefeitorioPage (/tv/refeitorio)", async () => {
    const cardapioExemplo = {
      Segunda: {
        almoco: {
          texto: "- Arroz (10 kg)\n- Feijão (5 kg)",
          quantidadePessoas: "300",
          observacoes: "Sem pimenta",
        },
      },
      Terça: {
        almoco: { texto: "- Macarrão (8 kg)" },
      },
      Quarta: { almoco: { texto: "- Frango (12 kg)" } },
      Quinta: { almoco: { texto: "- Carne (12 kg)" } },
      Sexta: { almoco: { texto: "- Peixe (10 kg)" } },
    };
    localStorage.setItem(
      "@gestao_refeitorio:cardapio_semanal",
      JSON.stringify(cardapioExemplo)
    );
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(cardapioExemplo), { status: 200 })
    );
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

    const { unmount } = render(<CardapioTvPage />);
    expect(screen.getByText("Transmissão nas TVs")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /TV do Refeitório/i }));
    fireEvent.click(screen.getByRole("button", { name: /Copiar/i }));
    fireEvent.click(screen.getByRole("button", { name: /TV da Cozinha/i }));
    unmount();

    const tv1 = render(<TvMuralPage />);
    await waitFor(() => {
      expect(screen.getByText("COZINHA")).toBeInTheDocument();
      expect(screen.getByAltText(/IFPE/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle(/Tela Cheia/i));
    tv1.unmount();

    const tv2 = render(<TvRefeitorioPage />);
    await waitFor(() => {
      expect(screen.getByText("REFEITÓRIO")).toBeInTheDocument();
      expect(screen.getByAltText(/IFPE/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle(/Tela Cheia/i));
    tv2.unmount();
  });

  it("renderiza LoginPageRedirect (/login), RootLayout e rota /api/cardapio-semanal", async () => {
    render(<LoginPageRedirect />);
    expect(mockReplace).toHaveBeenCalledWith("/");

    mockPathname = "/tv";
    const tvLayout = render(
      <RootLayout>
        <span>Conteúdo TV</span>
      </RootLayout>
    );
    expect(screen.getByText("Conteúdo TV")).toBeInTheDocument();
    tvLayout.unmount();

    mockPathname = "/consumo";
    const appLayout = render(
      <RootLayout>
        <span>Conteúdo Interno</span>
      </RootLayout>
    );
    expect(screen.getByText("Conteúdo Interno")).toBeInTheDocument();
    const btnSair = screen.queryByRole("button", { name: /Sair/i });
    if (btnSair) {
      fireEvent.click(btnSair);
    }
    appLayout.unmount();

    mockPathname = "/";
    const authLayout = render(
      <RootLayout>
        <span>Conteúdo Login</span>
      </RootLayout>
    );
    expect(screen.getByText("Conteúdo Login")).toBeInTheDocument();
    authLayout.unmount();

    // Rota /api/cardapio-semanal: 401 sem autenticação e 200 autenticado
    const reqSemAuth = new NextRequest("http://localhost:3000/api/cardapio-semanal", {
      method: "POST",
      body: JSON.stringify({ Segunda: {} }),
    });
    const res401 = await postCardapioApi(reqSemAuth);
    expect(res401.status).toBe(401);

    const reqComAuth = new NextRequest("http://localhost:3000/api/cardapio-semanal", {
      method: "POST",
      headers: { authorization: "Bearer token-valido" },
      body: JSON.stringify({ Segunda: { cafe: { texto: "- Pão" } } }),
    });
    const res200 = await postCardapioApi(reqComAuth);
    expect(res200.status).toBe(200);

    const resGet = await getCardapioApi();
    expect(resGet.status).toBe(200);
  });
});
