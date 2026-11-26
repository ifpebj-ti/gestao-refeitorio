import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import LoginPage from "@/app/page";
import {
  limparSessaoLocal,
  salvarSessaoToken,
  STORAGE_USER_KEY,
  STORAGE_PERFIL_KEY,
} from "@/lib/authSession";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/",
}));

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (res: { credential?: string }) => void;
    onError: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onSuccess({ credential: "google-id-token-valido" })}
      >
        Simular Google Sucesso
      </button>
      <button type="button" onClick={() => onError()}>
        Simular Google Erro
      </button>
    </div>
  ),
}));

function criarJwtValido(expOffsetSegundos = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "user@ifpe.edu.br",
      exp: Math.floor(Date.now() / 1000) + expOffsetSegundos,
    })
  );
  return `${header}.${payload}.assinatura`;
}

function ConsumidorAuthTeste() {
  const {
    autenticado,
    perfil,
    usuario,
    logout,
    toggleMenuMobile,
    fecharMenuMobile,
    dispensarBannerAlertas,
  } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{autenticado ? "LOGADO" : "DESLOGADO"}</span>
      <span data-testid="auth-perfil">{perfil}</span>
      <span data-testid="auth-email">{usuario?.email || "NENHUM"}</span>
      <button type="button" onClick={logout}>
        Sair
      </button>
      <button type="button" onClick={toggleMenuMobile}>
        ToggleMobile
      </button>
      <button type="button" onClick={fecharMenuMobile}>
        FecharMobile
      </button>
      <button type="button" onClick={dispensarBannerAlertas}>
        DispensarBanner
      </button>
    </div>
  );
}

describe("Tela de Login e Contexto de Autenticação (AuthContext + LoginPage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    limparSessaoLocal();
  });

  it("alterna entre login Google e usuário/senha, limpando a senha ao voltar", async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByText("Entre com sua conta Google")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Entrar com usuário e senha"));
    expect(screen.getByText("Informe seu usuário e senha")).toBeInTheDocument();

    const formLogin = screen.getByRole("button", { name: "Entrar" }).closest("form");
    expect(formLogin).toHaveAttribute("method", "post");

    const inputUsuario = screen.getByLabelText("Usuário") as HTMLInputElement;
    const inputSenha = screen.getByLabelText("Senha") as HTMLInputElement;

    fireEvent.change(inputUsuario, { target: { value: "cozinha@ifpe.edu.br" } });
    fireEvent.change(inputSenha, { target: { value: "MinhaSenhaSuperForte123" } });
    expect(inputSenha.value).toBe("MinhaSenhaSuperForte123");

    // Voltar para Google e reabrir formulário: senha não deve permanecer preenchida
    fireEvent.click(screen.getByText("Voltar"));
    expect(screen.getByText("Entre com sua conta Google")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Entrar com usuário e senha"));
    const inputSenhaAposVoltar = screen.getByLabelText("Senha") as HTMLInputElement;
    expect(inputSenhaAposVoltar.value).toBe("");
    expect(localStorage.getItem("senha")).toBeNull();
  });

  it("autentica com usuário e senha via POST /api/auth/local e redireciona conforme o perfil", async () => {
    const token = criarJwtValido(3600);
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          token,
          nome: "Sami Cozinheira",
          email: "cozinha@ifpe.edu.br",
          perfil: "COZINHA",
        }),
        { status: 200 }
      )
    );

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Entrar com usuário e senha"));
    fireEvent.change(screen.getByLabelText("Usuário"), {
      target: { value: "cozinha@ifpe.edu.br" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "SenhaValidaCom12Chars" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form")!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/consumo");
    });
  });

  it("exibe mensagens específicas para erros 401 e 429 no login com usuário e senha", async () => {
    const fetchMock = vi.spyOn(global, "fetch");

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Entrar com usuário e senha"));

    // 1. Testar erro 401
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fireEvent.change(screen.getByLabelText("Usuário"), {
      target: { value: "admin@ifpe.edu.br" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "SenhaIncorreta123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "E-mail ou senha inválidos."
      );
    });

    // 2. Testar erro 429 (Rate limit)
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "OutraTentativa123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Muitas tentativas. Tente novamente em alguns minutos."
      );
    });
  });

  it("autentica com Google para perfil ADMIN redirecionando para /usuarios e trata erro no login Google", async () => {
    const token = criarJwtValido(3600);
    const fetchMock = vi.spyOn(global, "fetch");

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    // Erro de popup do Google
    fireEvent.click(screen.getByText("Simular Google Erro"));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Falha ao abrir a autenticação do Google. Tente novamente."
    );

    // Sucesso Google como ADMIN
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          token,
          nome: "Raphaela Admin",
          email: "admin@ifpe.edu.br",
          perfil: "ADMIN",
        }),
        { status: 200 }
      )
    );

    fireEvent.click(screen.getByText("Simular Google Sucesso"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/usuarios");
    });
  });

  it("restaura sessão existente e realiza logout limpando credenciais", async () => {
    const token = criarJwtValido(3600);
    salvarSessaoToken(token);
    localStorage.setItem(
      STORAGE_USER_KEY,
      JSON.stringify({
        nome: "Nutri IFPE",
        email: "nutri@ifpe.edu.br",
        perfil: "NUTRICIONISTA",
      })
    );
    localStorage.setItem(STORAGE_PERFIL_KEY, "NUTRICIONISTA");

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    render(
      <AuthProvider>
        <ConsumidorAuthTeste />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("LOGADO");
    });
    expect(screen.getByTestId("auth-perfil")).toHaveTextContent("NUTRICIONISTA");
    expect(screen.getByTestId("auth-email")).toHaveTextContent("nutri@ifpe.edu.br");

    fireEvent.click(screen.getByText("ToggleMobile"));
    fireEvent.click(screen.getByText("FecharMobile"));
    fireEvent.click(screen.getByText("DispensarBanner"));
    fireEvent.click(screen.getByText("Sair"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("DESLOGADO");
    });
  });

  it("restaura sessão via GET /api/auth/me ao reabrir aba sem JWT em memória (cookie HttpOnly — #489)", async () => {
    localStorage.setItem(
      STORAGE_USER_KEY,
      JSON.stringify({
        nome: "Nutri IFPE",
        email: "nutri@ifpe.edu.br",
        perfil: "NUTRICIONISTA",
      })
    );

    const fetchMock = vi.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/auth/me")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              nome: "Nutri IFPE",
              email: "nutri@ifpe.edu.br",
              perfil: "NUTRICIONISTA",
            }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    });

    render(
      <AuthProvider>
        <ConsumidorAuthTeste />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("LOGADO");
    });
    expect(screen.getByTestId("auth-perfil")).toHaveTextContent("NUTRICIONISTA");
    expect(screen.getByTestId("auth-email")).toHaveTextContent("nutri@ifpe.edu.br");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("limpa sessão local se GET /api/auth/me retornar 401 ao reabrir aba (#489)", async () => {
    localStorage.setItem(
      STORAGE_USER_KEY,
      JSON.stringify({
        nome: "Nutri IFPE",
        email: "nutri@ifpe.edu.br",
        perfil: "NUTRICIONISTA",
      })
    );

    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(null, { status: 401 }));

    render(
      <AuthProvider>
        <ConsumidorAuthTeste />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("DESLOGADO");
    });
    expect(localStorage.getItem(STORAGE_USER_KEY)).toBeNull();
  });
});

