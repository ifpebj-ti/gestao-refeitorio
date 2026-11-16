import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GestaoUsuariosPage from "@/app/(admin)/usuarios/page";
import * as usuariosApi from "@/lib/usuarios";

const mockPush = vi.fn();
let mockAuthState = {
  autenticado: true,
  carregando: false,
  perfil: "ADMIN" as "ADMIN" | "NUTRICIONISTA" | "COZINHA",
  usuario: {
    nome: "Raphaela Samille",
    email: "samramalho4@gmail.com",
    perfil: "ADMIN" as const,
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock("@/app/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

const usuariosMock: usuariosApi.UsuarioDTO[] = [
  {
    id: "u1",
    nome: "Raphaela Samille",
    email: "samramalho4@gmail.com",
    perfil: "ADMIN",
    ativo: true,
    criadoEm: "2026-11-14T10:00:00Z",
    possuiSenhaLocal: false,
  },
  {
    id: "u2",
    nome: "Sami Cozinheira",
    email: "cozinha@ifpe.edu.br",
    perfil: "COZINHA",
    ativo: true,
    criadoEm: "2026-11-14T10:00:00Z",
    possuiSenhaLocal: true,
  },
  {
    id: "u3",
    nome: "Raphinha Nutri",
    email: "nutri@ifpe.edu.br",
    perfil: "NUTRICIONISTA",
    ativo: false,
    criadoEm: "2026-10-16T10:00:00Z",
    possuiSenhaLocal: false,
  },
];

describe("Página de Gestão de Usuários e Senhas Locais (ADMIN)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      autenticado: true,
      carregando: false,
      perfil: "ADMIN",
      usuario: {
        nome: "Raphaela Samille",
        email: "samramalho4@gmail.com",
        perfil: "ADMIN",
      },
    };
    vi.spyOn(usuariosApi, "listarUsuarios").mockResolvedValue(usuariosMock);
    vi.spyOn(usuariosApi, "cadastrarUsuario").mockResolvedValue({
      id: "u4",
      nome: "Novo Usuário",
      email: "novo@ifpe.edu.br",
      perfil: "NUTRICIONISTA",
      ativo: true,
      possuiSenhaLocal: false,
    });
    vi.spyOn(usuariosApi, "editarUsuario").mockResolvedValue(usuariosMock[1]);
    vi.spyOn(usuariosApi, "desativarUsuario").mockResolvedValue({
      ...usuariosMock[1],
      ativo: false,
    });
    vi.spyOn(usuariosApi, "definirSenhaUsuario").mockResolvedValue(undefined);
    vi.spyOn(usuariosApi, "removerSenhaUsuario").mockResolvedValue(undefined);
  });

  it("redireciona para /consumo quando o usuário autenticado não é ADMIN", async () => {
    mockAuthState.perfil = "COZINHA";
    render(<GestaoUsuariosPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/consumo");
    });
  });

  it("lista usuários com perfis simplificados (Admin, Cozinha, Nutri), indicador de senha (Sim/Não) e filtra resultados", async () => {
    render(<GestaoUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText("Raphaela Samille")).toBeInTheDocument();
    });

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Sami Cozinheira")).toBeInTheDocument();
    expect(screen.getByText("Nutri")).toBeInTheDocument();
    expect(screen.getByText("Sim")).toBeInTheDocument();
    expect(screen.getAllByText("Não").length).toBeGreaterThanOrEqual(2);

    // Filtrar por busca
    const inputBusca = screen.getByPlaceholderText("Buscar por nome ou e-mail...");
    fireEvent.change(inputBusca, { target: { value: "Sami Cozinheira" } });
    expect(screen.getByText("Sami Cozinheira")).toBeInTheDocument();
    expect(screen.queryByText("Raphinha Nutri")).not.toBeInTheDocument();

    fireEvent.change(inputBusca, { target: { value: "" } });

    // Filtrar por status INATIVOS
    fireEvent.change(screen.getByDisplayValue("Todos os Status"), {
      target: { value: "INATIVOS" },
    });
    expect(screen.getByText("Raphinha Nutri")).toBeInTheDocument();
    expect(screen.queryByText("Sami Cozinheira")).not.toBeInTheDocument();
  });

  it("valida e define senha local (mínimo de 12 caracteres e confirmação) no modal Definir Senha", async () => {
    render(<GestaoUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText("Raphaela Samille")).toBeInTheDocument();
    });

    const botoesDefinir = screen.getAllByText("Definir senha");
    fireEvent.click(botoesDefinir[0]);

    expect(screen.getByText("Definir Senha Local")).toBeInTheDocument();

    const inputNova = screen.getByLabelText("Nova Senha *");
    const inputConfirma = screen.getByLabelText("Confirmar Senha *");

    // 1. Senha menor que 12 caracteres
    fireEvent.change(inputNova, { target: { value: "curta123" } });
    fireEvent.change(inputConfirma, { target: { value: "curta123" } });
    fireEvent.submit(screen.getByText("Salvar Senha").closest("form")!);
    expect(
      screen.getByText("A senha deve ter pelo menos 12 caracteres.")
    ).toBeInTheDocument();

    // 2. Confirmação divergente
    fireEvent.change(inputNova, { target: { value: "SenhaForteCom12Chars!" } });
    fireEvent.change(inputConfirma, { target: { value: "OutraSenhaCom12Chars!" } });
    fireEvent.submit(screen.getByText("Salvar Senha").closest("form")!);
    expect(
      screen.getByText("A confirmação de senha não confere.")
    ).toBeInTheDocument();

    // 3. Sucesso
    fireEvent.change(inputConfirma, { target: { value: "SenhaForteCom12Chars!" } });
    fireEvent.submit(screen.getByText("Salvar Senha").closest("form")!);

    await waitFor(() => {
      expect(usuariosApi.definirSenhaUsuario).toHaveBeenCalledWith(
        "u1",
        "SenhaForteCom12Chars!"
      );
    });
  });

  it("permite remover senha local a partir do modal Redefinir Senha", async () => {
    render(<GestaoUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText("Sami Cozinheira")).toBeInTheDocument();
    });

    // Sami Cozinheira possuiSenhaLocal = true -> botão Redefinir senha
    fireEvent.click(screen.getByText("Redefinir senha"));
    expect(screen.getByText("Redefinir Senha Local")).toBeInTheDocument();

    // Clicar em Remover senha dentro do modal
    fireEvent.click(screen.getByText("Remover senha"));
    expect(screen.getByText("Remover Senha Local")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Remover Senha"));

    await waitFor(() => {
      expect(usuariosApi.removerSenhaUsuario).toHaveBeenCalledWith("u2");
    });
  });

  it("cadastra novo usuário com senha opcional, edita e desativa usuário", async () => {
    render(<GestaoUsuariosPage />);

    await waitFor(() => {
      expect(screen.getByText("Raphaela Samille")).toBeInTheDocument();
    });

    // Abrir modal Novo Usuário
    fireEvent.click(screen.getByText("Novo Usuário"));
    fireEvent.change(screen.getByPlaceholderText("Ex: Dra. Juliana Menezes"), {
      target: { value: "Dra. Juliana" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("exemplo@gmail.com ou @ifpe.edu.br"),
      { target: { value: "juliana@ifpe.edu.br" } }
    );

    // Preencher senha opcional
    const inputSenhaOpcional = screen.getByPlaceholderText("Mínimo de 12 caracteres");
    fireEvent.change(inputSenhaOpcional, {
      target: { value: "SenhaInicial1234" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Repita a senha (mínimo de 12 caracteres)"),
      { target: { value: "SenhaInicial1234" } }
    );

    fireEvent.submit(screen.getByText("Salvar Usuário").closest("form")!);

    await waitFor(() => {
      expect(usuariosApi.cadastrarUsuario).toHaveBeenCalled();
      expect(usuariosApi.definirSenhaUsuario).toHaveBeenCalledWith(
        "u4",
        "SenhaInicial1234"
      );
    });

    // Editar usuário
    const botoesEditar = screen.getAllByTitle("Editar usuário");
    fireEvent.click(botoesEditar[1]);
    fireEvent.submit(screen.getByText("Salvar Alterações").closest("form")!);

    await waitFor(() => {
      expect(usuariosApi.editarUsuario).toHaveBeenCalled();
    });

    // Desativar usuário
    const botoesDesativar = screen.getAllByTitle("Desativar usuário");
    fireEvent.click(botoesDesativar[0]);
    fireEvent.click(screen.getByText("Confirmar Desativação"));

    await waitFor(() => {
      expect(usuariosApi.desativarUsuario).toHaveBeenCalledWith("u2");
    });
  });
});
