import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GestaoNotasPage from "@/app/(nutri)/notas/page";
import * as notasApi from "@/lib/notas";
import * as remetentesApi from "@/lib/remetentes";
import { salvarSessaoToken, limparSessaoLocal } from "@/lib/authSession";

const mockPush = vi.fn();
let mockAuthState = {
  autenticado: true,
  carregando: false,
  perfil: "NUTRICIONISTA" as "ADMIN" | "NUTRICIONISTA" | "COZINHA",
  usuario: {
    nome: "Raphinha Nutri",
    email: "nutri@ifpe.edu.br",
    perfil: "NUTRICIONISTA" as const,
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

function criarJwtValido(expOffsetSegundos = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "nutri@ifpe.edu.br",
      exp: Math.floor(Date.now() / 1000) + expOffsetSegundos,
    })
  );
  return `${header}.${payload}.assinatura`;
}

const remetentesMock: remetentesApi.RemetenteDTO[] = [
  {
    id: "rem-1",
    nome: "Agroindústria Campus BJ",
    documento: "12345678000199",
    contato: "agro@ifpe.edu.br",
    ativo: true,
  },
  {
    id: "rem-2",
    nome: "Fornecedor Antigo Inativo",
    documento: "12345678901",
    contato: "81999990000",
    ativo: false,
  },
];

const entradasDisponiveisMock: notasApi.NotaEntradaDTO[] = [
  {
    movimentacaoId: "mov-1",
    produtoId: "prod-1",
    produtoNome: "Leite Pasteurizado",
    quantidade: 40,
    unidadeMedida: "Lt",
    localId: "loc-1",
    localNome: "Câmara Fria",
    lote: "LOTE-01",
    dataValidade: "2026-12-01",
    data: "2026-11-20",
  },
];

const notasResumoMock: notasApi.NotaResumoDTO[] = [
  {
    id: "nota-1",
    numero: "NF-1020",
    tipo: "EXTERNA",
    data: "2026-11-20",
    remetenteNome: "Agroindústria Campus BJ",
    status: "PENDENTE",
    quantidadeEntradas: 1,
    possuiDocumento: true,
  },
  {
    id: "nota-2",
    numero: "NL-2026-0001",
    tipo: "LOCAL",
    data: "2026-11-20",
    remetenteNome: "Agroindústria Campus BJ",
    responsavelEntrega: "Carlos Agro",
    status: "PENDENTE",
    quantidadeEntradas: 1,
    possuiDocumento: false,
  },
];

const notaDetalheExternaMock: notasApi.NotaResponseDTO = {
  id: "nota-1",
  numero: "NF-1020",
  tipo: "EXTERNA",
  data: "2026-11-20",
  status: "PENDENTE",
  remetente: { id: "rem-1", nome: "Agroindústria Campus BJ" },
  entradas: entradasDisponiveisMock,
  registradoPor: { id: "u-nutri", nome: "Raphinha Nutri", email: "nutri@ifpe.edu.br" },
  observacoes: "Entrega conferida na recepção",
  possuiDocumento: true,
};

const notaDetalheLocalMock: notasApi.NotaResponseDTO = {
  id: "nota-2",
  numero: "NL-2026-0001",
  tipo: "LOCAL",
  data: "2026-11-20",
  status: "PENDENTE",
  remetente: { id: "rem-1", nome: "Agroindústria Campus BJ" },
  entradas: entradasDisponiveisMock,
  registradoPor: { id: "u-nutri", nome: "Raphinha Nutri", email: "nutri@ifpe.edu.br" },
  responsavelEntrega: "Carlos Agro",
  possuiDocumento: false,
};

describe("Serviços HTTP de Remetentes e Notas (lib/remetentes.ts e lib/notas.ts)", () => {
  beforeEach(() => {
    limparSessaoLocal();
    salvarSessaoToken(criarJwtValido(3600));
    vi.restoreAllMocks();
  });

  it("executa operações do serviço de remetentes (listar, buscar, cadastrar, editar, inativar e reativar — #415)", async () => {
    const fetchMock = vi.spyOn(global, "fetch");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(remetentesMock), { status: 200 })
    );
    expect(await remetentesApi.listarRemetentes(true)).toHaveLength(2);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(remetentesMock[0]), { status: 200 })
    );
    expect((await remetentesApi.buscarRemetentePorId("rem-1")).nome).toBe(
      "Agroindústria Campus BJ"
    );

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(remetentesMock[0]), { status: 201 })
    );
    expect(
      (await remetentesApi.cadastrarRemetente({ nome: "Agroindústria Campus BJ" })).id
    ).toBe("rem-1");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(remetentesMock[0]), { status: 200 })
    );
    await expect(
      remetentesApi.editarRemetente("rem-1", { nome: "Agro Editada" })
    ).resolves.toBeDefined();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ...remetentesMock[0], ativo: false }), { status: 200 })
    );
    expect((await remetentesApi.inativarRemetente("rem-1")).ativo).toBe(false);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ...remetentesMock[0], ativo: true }), { status: 200 })
    );
    expect((await remetentesApi.reativarRemetente("rem-1")).ativo).toBe(true);
  });

  it("executa operações do serviço de notas (listar, buscar, entradas, registrar, local, editar, validar, cancelar, anexo — #416 a #420)", async () => {
    const fetchMock = vi.spyOn(global, "fetch");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(notasResumoMock), { status: 200 })
    );
    expect(
      await notasApi.listarNotas({
        status: "PENDENTE",
        tipo: "EXTERNA",
        remetenteId: "rem-1",
        dataInicio: "2026-11-01",
        dataFim: "2026-11-30",
      })
    ).toHaveLength(2);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(notaDetalheExternaMock), { status: 200 })
    );
    expect((await notasApi.buscarNotaPorId("nota-1")).numero).toBe("NF-1020");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(entradasDisponiveisMock), { status: 200 })
    );
    expect(
      await notasApi.listarEntradasDisponiveisNota({
        dataInicio: "2026-11-01",
        dataFim: "2026-11-30",
      })
    ).toHaveLength(1);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(notaDetalheExternaMock), { status: 201 })
    );
    expect(
      (
        await notasApi.registrarNota({
          numero: "NF-1020",
          data: "2026-11-20",
          remetenteId: "rem-1",
          movimentacaoIds: ["mov-1"],
        })
      ).id
    ).toBe("nota-1");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(notaDetalheLocalMock), { status: 201 })
    );
    expect(
      (
        await notasApi.emitirNotaLocal({
          data: "2026-11-20",
          remetenteId: "rem-1",
          movimentacaoIds: ["mov-1"],
          responsavelEntrega: "Carlos Agro",
        })
      ).numero
    ).toBe("NL-2026-0001");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(notaDetalheExternaMock), { status: 200 })
    );
    await expect(
      notasApi.editarNotaPendente("nota-1", {
        numero: "NF-1020-B",
        data: "2026-11-20",
        remetenteId: "rem-1",
        movimentacaoIds: ["mov-1"],
      })
    ).resolves.toBeDefined();

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ...notaDetalheExternaMock, status: "VALIDADA" }),
        { status: 200 }
      )
    );
    expect((await notasApi.validarNota("nota-1")).status).toBe("VALIDADA");

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...notaDetalheExternaMock,
          status: "CANCELADA",
          justificativaCancelamento: "Divergência na nota",
        }),
        { status: 200 }
      )
    );
    expect(
      (await notasApi.cancelarNota("nota-1", "Divergência na nota")).status
    ).toBe("CANCELADA");

    // Upload de documento válido e inválido (#417)
    const docInvalido = new File(["exe"], "virus.exe", {
      type: "application/x-msdownload",
    });
    await expect(notasApi.anexarDocumentoNota("nota-1", docInvalido)).rejects.toThrow(
      "Documento inválido"
    );

    const pdfValido = new File(["%PDF-1.4"], "nota.pdf", {
      type: "application/pdf",
    });
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          notaId: "nota-1",
          contentType: "application/pdf",
          tamanhoBytes: 100,
          criadoEm: "2026-11-20T12:00:00Z",
        }),
        { status: 201 }
      )
    );
    expect((await notasApi.anexarDocumentoNota("nota-1", pdfValido)).notaId).toBe(
      "nota-1"
    );

    fetchMock.mockResolvedValueOnce(
      new Response("conteudo-pdf", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      })
    );
    const download = await notasApi.baixarDocumentoNota("nota-1");
    expect(download.contentType).toContain("application/pdf");

    // Testa compatibilidade 405 (container local sem GET /api/notas) retornando cache sem erro
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 405 }));
    const listaFallback = await notasApi.listarNotas({ status: "PENDENTE" });
    expect(Array.isArray(listaFallback)).toBe(true);

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 405 }));
    const detalheFallback = await notasApi.buscarNotaPorId("nota-1");
    expect(detalheFallback.id).toBe("nota-1");

    // Testa tratamento de erros HTTP (!res.ok) nos serviços de remetentes e notas
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ mensagem: "Erro de negócio" }), {
          status: 400,
        })
      )
    );
    await expect(remetentesApi.listarRemetentes()).rejects.toThrow("Erro de negócio");
    await expect(remetentesApi.buscarRemetentePorId("1")).rejects.toThrow("Erro de negócio");
    await expect(remetentesApi.cadastrarRemetente({ nome: "X" })).rejects.toThrow("Erro de negócio");
    await expect(remetentesApi.editarRemetente("1", { nome: "X" })).rejects.toThrow("Erro de negócio");
    await expect(remetentesApi.inativarRemetente("1")).rejects.toThrow("Erro de negócio");
    await expect(remetentesApi.reativarRemetente("1")).rejects.toThrow("Erro de negócio");

    await expect(notasApi.listarNotas()).rejects.toThrow("Erro de negócio");
    await expect(notasApi.buscarNotaPorId("1")).rejects.toThrow("Erro de negócio");
    await expect(notasApi.listarEntradasDisponiveisNota()).rejects.toThrow("Erro de negócio");
    await expect(
      notasApi.registrarNota({
        numero: "1",
        data: "2026-11-20",
        remetenteId: "r1",
        movimentacaoIds: ["m1"],
      })
    ).rejects.toThrow("Erro de negócio");
    await expect(
      notasApi.emitirNotaLocal({
        data: "2026-11-20",
        remetenteId: "r1",
        movimentacaoIds: ["m1"],
        responsavelEntrega: "João",
      })
    ).rejects.toThrow("Erro de negócio");
    await expect(
      notasApi.editarNotaPendente("1", {
        numero: "1",
        data: "2026-11-20",
        remetenteId: "r1",
        movimentacaoIds: ["m1"],
      })
    ).rejects.toThrow("Erro de negócio");
    await expect(notasApi.validarNota("1")).rejects.toThrow("Erro de negócio");
    await expect(notasApi.cancelarNota("1", "Motivo")).rejects.toThrow("Erro de negócio");
    await expect(notasApi.anexarDocumentoNota("1", pdfValido)).rejects.toThrow("Erro de negócio");
    await expect(notasApi.baixarDocumentoNota("1")).rejects.toThrow("Erro de negócio");
  });
});

describe("Página de Gestão de Notas e Remetentes (NUTRICIONISTA — #415 a #420)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      autenticado: true,
      carregando: false,
      perfil: "NUTRICIONISTA",
      usuario: {
        nome: "Raphinha Nutri",
        email: "nutri@ifpe.edu.br",
        perfil: "NUTRICIONISTA",
      },
    };

    vi.spyOn(notasApi, "listarNotas").mockResolvedValue(notasResumoMock);
    vi.spyOn(remetentesApi, "listarRemetentes").mockResolvedValue(remetentesMock);
    vi.spyOn(notasApi, "listarEntradasDisponiveisNota").mockResolvedValue(
      entradasDisponiveisMock
    );
    vi.spyOn(notasApi, "buscarNotaPorId").mockResolvedValue(notaDetalheExternaMock);
    vi.spyOn(notasApi, "registrarNota").mockResolvedValue(notaDetalheExternaMock);
    vi.spyOn(notasApi, "emitirNotaLocal").mockResolvedValue(notaDetalheLocalMock);
    vi.spyOn(notasApi, "editarNotaPendente").mockResolvedValue(notaDetalheExternaMock);
    vi.spyOn(notasApi, "validarNota").mockResolvedValue({
      ...notaDetalheExternaMock,
      status: "VALIDADA",
    });
    vi.spyOn(notasApi, "cancelarNota").mockResolvedValue({
      ...notaDetalheExternaMock,
      status: "CANCELADA",
      justificativaCancelamento: "Erro de digitação no documento",
    });
    vi.spyOn(remetentesApi, "cadastrarRemetente").mockResolvedValue(remetentesMock[0]);
    vi.spyOn(remetentesApi, "editarRemetente").mockResolvedValue(remetentesMock[0]);
    vi.spyOn(remetentesApi, "inativarRemetente").mockResolvedValue({
      ...remetentesMock[0],
      ativo: false,
    });
    vi.spyOn(remetentesApi, "reativarRemetente").mockResolvedValue({
      ...remetentesMock[1],
      ativo: true,
    });
  });

  it("redireciona perfis sem permissão (ADMIN -> /usuarios e COZINHA -> /consumo)", async () => {
    mockAuthState.perfil = "ADMIN";
    const { unmount } = render(<GestaoNotasPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/usuarios");
    });
    unmount();

    mockAuthState.perfil = "COZINHA";
    render(<GestaoNotasPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/consumo");
    });
  });

  it("lista notas, aplica filtros e abre modal de detalhes com validação e cancelamento justificado (#418, #419)", async () => {
    render(<GestaoNotasPage />);

    await waitFor(() => {
      expect(screen.getByText("NF-1020")).toBeInTheDocument();
      expect(screen.getByText("NL-2026-0001")).toBeInTheDocument();
    });

    // Filtrar por status
    fireEvent.change(screen.getByLabelText("Filtrar por status da nota"), {
      target: { value: "PENDENTE" },
    });
    await waitFor(() => {
      expect(notasApi.listarNotas).toHaveBeenCalled();
    });

    // Abrir detalhe da nota externa
    const botoesDetalhes = screen.getAllByRole("button", { name: "Ver" });
    fireEvent.click(botoesDetalhes[0]);

    await waitFor(() => {
      expect(screen.getByText(/Nota NF-1020/i)).toBeInTheDocument();
      expect(screen.getByText("Leite Pasteurizado")).toBeInTheDocument();
    });

    // Testar cancelamento com justificativa obrigatória
    fireEvent.click(screen.getByText("Cancelar Nota"));
    expect(screen.getByText("Cancelar Nota NF-1020")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Justificativa do Cancelamento *"), {
      target: { value: "Erro de digitação no documento" },
    });
    fireEvent.submit(screen.getByText("Confirmar Cancelamento").closest("form")!);

    await waitFor(() => {
      expect(notasApi.cancelarNota).toHaveBeenCalledWith(
        "nota-1",
        "Erro de digitação no documento"
      );
    });
  });

  it("registra nota externa vinculada às entradas e emite nota local com comprovante para assinatura (#416, #420)", async () => {
    render(<GestaoNotasPage />);

    await waitFor(() => {
      expect(screen.getByText("NF-1020")).toBeInTheDocument();
    });

    // 1. Registrar Nota Externa
    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
    await waitFor(() => {
      expect(screen.getByText("Leite Pasteurizado")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Número da Nota *"), {
      target: { value: "NF-2040" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByText("Salvar Nota").closest("form")!);

    await waitFor(() => {
      expect(notasApi.registrarNota).toHaveBeenCalledWith(
        expect.objectContaining({
          numero: "NF-2040",
          remetenteId: "rem-1",
          movimentacaoIds: ["mov-1"],
        })
      );
    });

    // 2. Emitir Nota Local
    fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
    await waitFor(() => {
      expect(
        screen.getByText("Emitir Nota Local de Recebimento")
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Responsável pela Entrega *"), {
      target: { value: "Carlos Agro" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByText("Salvar Nota").closest("form")!);

    await waitFor(() => {
      expect(notasApi.emitirNotaLocal).toHaveBeenCalledWith(
        expect.objectContaining({
          remetenteId: "rem-1",
          responsavelEntrega: "Carlos Agro",
          movimentacaoIds: ["mov-1"],
        })
      );
    });

    // 3. Visualizar comprovante de nota local para assinatura (#420)
    vi.spyOn(notasApi, "buscarNotaPorId").mockResolvedValueOnce(notaDetalheLocalMock);
    window.print = vi.fn();
    fireEvent.click(screen.getAllByRole("button", { name: "Ver" })[1]);

    await waitFor(() => {
      expect(screen.getByText("Imprimir para Assinatura")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Imprimir para Assinatura"));
    expect(screen.getByTestId("comprovante-nota-local")).toHaveTextContent(
      "COMPROVANTE INTERNO DE RECEBIMENTO — SEM VALOR FISCAL"
    );
  });

  it("gerencia remetentes na aba Remetentes (cadastrar com validação CPF/CNPJ, editar, inativar e reativar — #415)", async () => {
    render(<GestaoNotasPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Remetentes/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Remetentes/i }));

    expect(screen.getByText("Agroindústria Campus BJ")).toBeInTheDocument();
    expect(screen.getByText("Fornecedor Antigo Inativo")).toBeInTheDocument();

    // Abrir modal Novo Remetente
    fireEvent.click(screen.getByText("Novo Remetente"));
    fireEvent.change(screen.getByLabelText("Nome do Remetente *"), {
      target: { value: "Cooperativa Leiteira" },
    });

    // Testar CPF/CNPJ inválido
    fireEvent.change(screen.getByLabelText("CPF ou CNPJ (Opcional)"), {
      target: { value: "12345" },
    });
    fireEvent.submit(screen.getByText("Salvar Remetente").closest("form")!);
    expect(
      screen.getByText("O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).")
    ).toBeInTheDocument();

    // Corrigir CNPJ para 14 dígitos e salvar
    fireEvent.change(screen.getByLabelText("CPF ou CNPJ (Opcional)"), {
      target: { value: "12345678000199" },
    });
    fireEvent.submit(screen.getByText("Salvar Remetente").closest("form")!);

    await waitFor(() => {
      expect(remetentesApi.cadastrarRemetente).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: "Cooperativa Leiteira",
          documento: "12345678000199",
        })
      );
    });

    // Inativar e Reativar
    fireEvent.click(screen.getByText("Inativar"));
    await waitFor(() => {
      expect(remetentesApi.inativarRemetente).toHaveBeenCalledWith("rem-1");
    });

    fireEvent.click(screen.getByText("Reativar"));
    await waitFor(() => {
      expect(remetentesApi.reativarRemetente).toHaveBeenCalledWith("rem-2");
    });

    // Editar Remetente existente
    fireEvent.click(screen.getAllByText("Editar")[0]);
    expect(screen.getByText("Editar Remetente")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Contato (Opcional)"), {
      target: { value: "novo@ifpe.edu.br" },
    });
    fireEvent.submit(screen.getByText("Salvar Remetente").closest("form")!);
    await waitFor(() => {
      expect(remetentesApi.editarRemetente).toHaveBeenCalled();
    });
  });

  it("edita nota pendente, valida nota, anexa e baixa documento no modal de detalhes (#416, #417, #418)", async () => {
    vi.spyOn(notasApi, "anexarDocumentoNota").mockResolvedValue({
      notaId: "nota-1",
      contentType: "application/pdf",
      tamanhoBytes: 256,
      criadoEm: "2026-11-20T12:00:00Z",
    });
    vi.spyOn(notasApi, "baixarDocumentoNota").mockResolvedValue({
      blob: new Blob(["pdf"], { type: "application/pdf" }),
      contentType: "application/pdf",
    });

    render(<GestaoNotasPage />);

    await waitFor(() => {
      expect(screen.getByText("NF-1020")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ver" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Baixar Documento")).toBeInTheDocument();
    });

    // 1. Baixar documento anexado
    fireEvent.click(screen.getByText("Baixar Documento"));
    await waitFor(() => {
      expect(notasApi.baixarDocumentoNota).toHaveBeenCalledWith("nota-1");
    });

    // 2. Fazer upload de documento no detalhe
    const inputUpload = screen.getByLabelText("Upload de documento no detalhe");
    const arquivoPdf = new File(["%PDF"], "comprovante.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(inputUpload, { target: { files: [arquivoPdf] } });
    await waitFor(() => {
      expect(notasApi.anexarDocumentoNota).toHaveBeenCalledWith("nota-1", arquivoPdf);
    });

    // 3. Abrir modal de Editar Nota Pendente e salvar
    fireEvent.click(screen.getByText("Editar Nota"));
    await waitFor(() => {
      expect(screen.getByText("Editar Nota Pendente")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("Número da Nota *"), {
      target: { value: "NF-1020-EDITADA" },
    });
    fireEvent.submit(screen.getByText("Salvar Nota").closest("form")!);
    await waitFor(() => {
      expect(notasApi.editarNotaPendente).toHaveBeenCalled();
    });

    // 4. Validar nota pendente
    fireEvent.click(screen.getByText("Validar Nota"));
    await waitFor(() => {
      expect(notasApi.validarNota).toHaveBeenCalledWith("nota-1");
    });
  });
});
