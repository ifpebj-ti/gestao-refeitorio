import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  obterEstoqueMinimoPorCategoria,
  obterEstoqueMinimoProduto,
  verificarStatusEstoque,
} from "@/app/utils/estoqueRules";
import {
  normalizarUnidadeMedida,
  obterUnidadesDisponiveis,
  converterParaUnidadeBase,
} from "@/lib/unidades";
import {
  decodificarPayloadJwt,
  isTokenExpirado,
  salvarSessaoToken,
  getToken,
  limparSessaoLocal,
  notificarSessaoExpirada,
  tratarSessaoExpiradaSe401,
  STORAGE_TOKEN_KEY,
  SESSION_TOKEN_KEY,
  STORAGE_USER_KEY,
  STORAGE_PERFIL_KEY,
  EVENTO_SESSAO_EXPIRADA,
} from "@/lib/authSession";
import { calcularTotalAlertas } from "@/lib/alertasCount";
import {
  listarUsuarios,
  cadastrarUsuario,
  editarUsuario,
  desativarUsuario,
  definirSenhaUsuario,
  removerSenhaUsuario,
} from "@/lib/usuarios";
import {
  registrarEntradaApi,
  registrarSaidaApi,
  listarHistoricoApi,
} from "@/lib/movimentacoes";
import {
  buscarRelatorioMensal,
  exportarRelatorioPdf,
  exportarRelatorioExcel,
  buscarGraficoConsumo,
} from "@/lib/relatorios";
import { produtoService } from "@/lib/produtos";
import { api } from "@/lib/api";
import nextConfig from "../next.config.js";

function criarJwtValido(expOffsetSegundos = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "admin@ifpe.edu.br",
      perfil: "ADMIN",
      exp: Math.floor(Date.now() / 1000) + expOffsetSegundos,
    })
  );
  return `${header}.${payload}.assinatura`;
}

describe("Regras de estoque (estoqueRules)", () => {
  it("retorna o estoque mínimo padrão por categoria", () => {
    expect(obterEstoqueMinimoPorCategoria("Grãos & Cereais")).toBe(40);
    expect(obterEstoqueMinimoPorCategoria("Proteínas & Frios")).toBe(35);
    expect(obterEstoqueMinimoPorCategoria("Hortifrúti")).toBe(15);
    expect(obterEstoqueMinimoPorCategoria("Laticínios")).toBe(20);
    expect(obterEstoqueMinimoPorCategoria("Especificações & Condimentos")).toBe(10);
    expect(obterEstoqueMinimoPorCategoria("Outra")).toBe(20);
  });

  it("obtém estoque mínimo configurado do produto apenas quando positivo", () => {
    expect(obterEstoqueMinimoProduto(15)).toBe(15);
    expect(obterEstoqueMinimoProduto(0)).toBeUndefined();
    expect(obterEstoqueMinimoProduto(null)).toBeUndefined();
    expect(obterEstoqueMinimoProduto(undefined)).toBeUndefined();
  });

  it("verifica status NORMAL ou ATENCAO do estoque", () => {
    expect(verificarStatusEstoque(5, "Kg", "Grãos & Cereais", 10)).toBe("ATENCAO");
    expect(verificarStatusEstoque(25, "Kg", "Grãos & Cereais", 10)).toBe("NORMAL");
    expect(verificarStatusEstoque(0, "Kg", "Grãos & Cereais", null)).toBe("ATENCAO");
    expect(verificarStatusEstoque(5, "Kg", "Grãos & Cereais", null)).toBe("NORMAL");
  });
});

describe("Unidades de medida (unidades)", () => {
  it("normaliza diferentes variações de unidades de medida", () => {
    expect(normalizarUnidadeMedida()).toBe("Kg");
    expect(normalizarUnidadeMedida("quilograma")).toBe("Kg");
    expect(normalizarUnidadeMedida("grama")).toBe("g");
    expect(normalizarUnidadeMedida("litros")).toBe("Lt");
    expect(normalizarUnidadeMedida("mililitro")).toBe("ml");
    expect(normalizarUnidadeMedida("unidades")).toBe("Und");
    expect(normalizarUnidadeMedida("pacotes")).toBe("Pct");
    expect(normalizarUnidadeMedida("caixas")).toBe("Cx");
    expect(normalizarUnidadeMedida("latas")).toBe("Lata");
    expect(normalizarUnidadeMedida("vidros")).toBe("Vidro");
    expect(normalizarUnidadeMedida("bandejas")).toBe("Bandeja");
    expect(normalizarUnidadeMedida("maço")).toBe("Maço");
    expect(normalizarUnidadeMedida("sacos")).toBe("Saco");
    expect(normalizarUnidadeMedida("fardos")).toBe("Fardo");
    expect(normalizarUnidadeMedida("dúzia")).toBe("Dúzia");
    expect(normalizarUnidadeMedida("Personalizada")).toBe("Personalizada");
  });

  it("retorna unidades disponíveis compatíveis com a unidade base", () => {
    expect(obterUnidadesDisponiveis("Kg")).toEqual(["Kg", "g"]);
    expect(obterUnidadesDisponiveis("g")).toEqual(["g", "Kg"]);
    expect(obterUnidadesDisponiveis("Lt")).toEqual(["Lt", "ml"]);
    expect(obterUnidadesDisponiveis("ml")).toEqual(["ml", "Lt"]);
    expect(obterUnidadesDisponiveis("Pct")).toContain("Und");
    expect(obterUnidadesDisponiveis("Und")).toContain("Dúzia");
    expect(obterUnidadesDisponiveis("Cx")).toEqual(["Cx", "Und", "Pct"]);
    expect(obterUnidadesDisponiveis("Maço")).toEqual(["Maço", "Und"]);
    expect(obterUnidadesDisponiveis("Lata")).toEqual(["Lata", "Und"]);
    expect(obterUnidadesDisponiveis("Vidro")).toEqual(["Vidro", "Und"]);
    expect(obterUnidadesDisponiveis("Saco")).toContain("Saco");
  });

  it("converte valores corretamente para a unidade base", () => {
    expect(converterParaUnidadeBase(0, "g", "Kg")).toBe(0);
    expect(converterParaUnidadeBase(10, "Kg", "Kg")).toBe(10);
    expect(converterParaUnidadeBase(500, "g", "Kg")).toBe(0.5);
    expect(converterParaUnidadeBase(2, "Kg", "g")).toBe(2000);
    expect(converterParaUnidadeBase(500, "ml", "Lt")).toBe(0.5);
    expect(converterParaUnidadeBase(1.5, "Lt", "ml")).toBe(1500);
    expect(converterParaUnidadeBase(2, "dúzia", "Und")).toBe(24);
    expect(converterParaUnidadeBase(3, "Cx", "Und")).toBe(3);
  });
});

describe("Sessão e JWT (authSession)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    limparSessaoLocal();
  });

  it("decodifica JWT válido e rejeita tokens malformados", () => {
    const token = criarJwtValido(3600);
    const payload = decodificarPayloadJwt(token);
    expect(payload?.sub).toBe("admin@ifpe.edu.br");
    expect(decodificarPayloadJwt("")).toBeNull();
    expect(decodificarPayloadJwt("invalido")).toBeNull();
    expect(decodificarPayloadJwt("a.@@@.c")).toBeNull();
  });

  it("identifica corretamente tokens válidos e expirados", () => {
    expect(isTokenExpirado(null)).toBe(true);
    expect(isTokenExpirado("invalido")).toBe(true);
    expect(isTokenExpirado(criarJwtValido(-60))).toBe(true);
    expect(isTokenExpirado(criarJwtValido(3600))).toBe(false);
  });

  it("salva token no sessionStorage, remove legado do localStorage e recupera via getToken", () => {
    localStorage.setItem(STORAGE_TOKEN_KEY, "token-antigo-inseguro");
    const tokenValido = criarJwtValido(3600);
    salvarSessaoToken(tokenValido);

    expect(localStorage.getItem(STORAGE_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_TOKEN_KEY)).toBe(tokenValido);
    expect(getToken()).toBe(tokenValido);

    salvarSessaoToken(null);
    expect(sessionStorage.getItem(SESSION_TOKEN_KEY)).toBeNull();
  });

  it("limpa sessão e dispara evento quando token em sessão expira ou ocorre 401", () => {
    const listener = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, listener);

    const tokenExpirado = criarJwtValido(-120);
    sessionStorage.setItem(SESSION_TOKEN_KEY, tokenExpirado);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({ nome: "Teste" }));
    localStorage.setItem(STORAGE_PERFIL_KEY, "ADMIN");

    expect(getToken()).toBeNull();
    expect(listener).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_USER_KEY)).toBeNull();

    expect(tratarSessaoExpiradaSe401(401)).toBe(true);
    expect(tratarSessaoExpiradaSe401(500)).toBe(false);
    notificarSessaoExpirada();

    window.removeEventListener(EVENTO_SESSAO_EXPIRADA, listener);
  });
});

describe("Contagem de alertas (alertasCount)", () => {
  it("calcula total de alertas para estoque zerado, estoque baixo e validade próxima", () => {
    expect(calcularTotalAlertas([])).toBe(0);

    const hoje = new Date();
    const amanha = new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dataProx = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, "0")}-${String(amanha.getDate()).padStart(2, "0")}`;

    const total = calcularTotalAlertas(
      [
        { id: "p1", nome: "Arroz", categoria: "Grãos & Cereais", unidadeMedida: "Kg", saldoTotal: 0 },
        { id: "p2", nome: "Feijão", categoria: "Grãos & Cereais", unidadeMedida: "Kg", saldoTotal: 5, quantidadeMinima: 10 },
        { id: "p3", nome: "Leite", categoria: "Laticínios", unidadeMedida: "Lt", saldoTotal: 50, quantidadeMinima: 10 },
      ],
      [
        {
          id: "m1",
          produtoId: "p3",
          localId: "l1",
          tipo: "ENTRADA",
          quantidade: 50,
          data: "2026-11-01",
          origem: "EXTERNA",
          valor: 200,
          dataValidade: dataProx,
        },
      ]
    );

    expect(total).toBe(3);
  });
});

describe("Serviços de API (usuarios, movimentacoes, relatorios, produtos, api)", () => {
  beforeEach(() => {
    limparSessaoLocal();
    salvarSessaoToken(criarJwtValido(3600));
    vi.restoreAllMocks();
  });

  it("executa operações do módulo de usuários (listar, cadastrar, editar, desativar, definir e remover senha)", async () => {
    const fetchMock = vi.spyOn(global, "fetch");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "1", nome: "Admin", email: "a@ifpe.edu.br", perfil: "ADMIN", ativo: true, possuiSenhaLocal: true }]), { status: 200 })
    );
    const lista = await listarUsuarios();
    expect(lista).toHaveLength(1);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "2", nome: "Novo", email: "n@ifpe.edu.br", perfil: "COZINHA", ativo: true }), { status: 201 })
    );
    const novo = await cadastrarUsuario({ nome: "Novo", email: "n@ifpe.edu.br", perfil: "COZINHA" });
    expect(novo.id).toBe("2");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "2", nome: "Novo Editado", email: "n@ifpe.edu.br", perfil: "NUTRICIONISTA", ativo: true }), { status: 200 })
    );
    const editado = await editarUsuario("2", { nome: "Novo Editado", perfil: "NUTRICIONISTA" });
    expect(editado.perfil).toBe("NUTRICIONISTA");

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(definirSenhaUsuario("2", "SenhaForte12345")).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(removerSenhaUsuario("2")).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "2", nome: "Novo", email: "n@ifpe.edu.br", perfil: "COZINHA", ativo: false }), { status: 200 })
    );
    const desativado = await desativarUsuario("2");
    expect(desativado.ativo).toBe(false);
  });

  it("trata erros HTTP nas operações de usuários", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ mensagem: "Falha de validação" }), { status: 400 })
      )
    );

    await expect(listarUsuarios()).rejects.toThrow("Falha de validação");
    await expect(cadastrarUsuario({ nome: "A", email: "a@b.com", perfil: "ADMIN" })).rejects.toThrow("Falha de validação");
    await expect(editarUsuario("1", { nome: "A", perfil: "ADMIN" })).rejects.toThrow("Falha de validação");
    await expect(desativarUsuario("1")).rejects.toThrow("Falha de validação");
    await expect(definirSenhaUsuario("1", "123456789012")).rejects.toThrow("Falha de validação");
    await expect(removerSenhaUsuario("1")).rejects.toThrow("Falha de validação");

    // Testa erro 403 em definirSenhaUsuario e falta de token
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(definirSenhaUsuario("1", "123456789012")).rejects.toThrow(
      "Erro ao definir senha do usuário (403)"
    );

    limparSessaoLocal();
    await expect(listarUsuarios()).rejects.toThrow("Sessão expirada");
  });

  it("executa operações de movimentações (entrada, foto, saída e histórico)", async () => {
    const fetchMock = vi.spyOn(global, "fetch");

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "mov-1", produtoId: "p1", localId: "l1", tipo: "ENTRADA", quantidade: 10, data: "2026-11-14", origem: "EXTERNA", valor: 50 }), { status: 201 })
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const fotoValida = new File(["conteudo"], "nota.png", { type: "image/png" });
    const entrada = await registrarEntradaApi(
      { produtoId: "p1", localId: "l1", quantidade: 10, data: "2026-11-14", origem: "EXTERNA", valor: 50 },
      fotoValida
    );
    expect(entrada.id).toBe("mov-1");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "mov-2", produtoId: "p1", localId: "l1", tipo: "SAIDA", quantidade: 2, data: "2026-11-14", origem: "INTERNA", valor: 0 }), { status: 201 })
    );
    const saida = await registrarSaidaApi({
      produtoId: "p1",
      localId: "l1",
      quantidade: 2,
      data: "2026-11-14",
      tipoSaida: "CONSUMO",
    });
    expect(saida.id).toBe("mov-2");

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([entrada, saida]), { status: 200 }));
    const historico = await listarHistoricoApi();
    expect(historico).toHaveLength(2);

    // Testa validação de foto inválida (tipo não permitido) e erros HTTP em movimentações
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "mov-3", produtoId: "p1", localId: "l1", tipo: "ENTRADA", quantidade: 1, data: "2026-11-14", origem: "EXTERNA", valor: 10 }), { status: 201 })
    );
    const arquivoInvalido = new File(["texto"], "doc.pdf", { type: "application/pdf" });
    await expect(
      registrarEntradaApi(
        { produtoId: "p1", localId: "l1", quantidade: 1, data: "2026-11-14", origem: "EXTERNA", valor: 10 },
        arquivoInvalido
      )
    ).rejects.toThrow("Arquivo de foto inválido");

    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response("Erro servidor", { status: 500 }))
    );
    await expect(
      registrarEntradaApi({ produtoId: "p1", localId: "l1", quantidade: 1, data: "2026-11-14", origem: "EXTERNA", valor: 10 })
    ).rejects.toThrow("Erro na API (500)");
    await expect(
      registrarSaidaApi({ produtoId: "p1", localId: "l1", quantidade: 1, data: "2026-11-14", tipoSaida: "CONSUMO" })
    ).rejects.toThrow("Erro na API (500)");
    await expect(listarHistoricoApi()).rejects.toThrow("Erro ao buscar histórico (500)");
  });

  it("executa operações de relatórios (mensal, gráfico, exportação PDF e Excel)", async () => {
    const fetchMock = vi.spyOn(global, "fetch");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ produtoId: "p1", produtoNome: "Arroz", quantidadeEntradas: 20, quantidadeSaidas: 5, quantidadeProducaoInterna: 0, valorEntradas: 100, saldoFinal: 15 }]), { status: 200 })
    );
    const rel = await buscarRelatorioMensal("2026-11-01", "2026-11-30");
    expect(rel[0].produtoNome).toBe("Arroz");

    fetchMock.mockResolvedValueOnce(new Response("pdf-content", { status: 200 }));
    await expect(exportarRelatorioPdf("2026-11-01", "2026-11-30")).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(new Response("xlsx-content", { status: 200 }));
    await expect(exportarRelatorioExcel("2026-11-01", "2026-11-30")).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ data: "2026-11-14", quantidade: 5 }]), { status: 200 })
    );
    const grafico = await buscarGraficoConsumo("2026-11-01", "2026-11-30", "p1");
    expect(grafico).toHaveLength(1);

    // Testa erros HTTP nos relatórios
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response("Falha", { status: 500 }))
    );
    await expect(buscarRelatorioMensal("2026-11-01", "2026-11-30")).rejects.toThrow("Erro ao buscar relatório (500)");
    await expect(exportarRelatorioPdf("2026-11-01", "2026-11-30")).rejects.toThrow("Erro ao exportar PDF (500)");
    await expect(exportarRelatorioExcel("2026-11-01", "2026-11-30")).rejects.toThrow("Erro ao exportar Excel (500)");
    await expect(buscarGraficoConsumo("2026-11-01", "2026-11-30")).rejects.toThrow("Erro ao buscar gráfico (500)");
  });

  it("executa métodos do produtoService e interceptores do axios (api)", async () => {
    // Executa os interceptores de requisição e resposta do axios
    const reqInterceptor = (api.interceptors.request as unknown as { handlers: { fulfilled: (cfg: { headers: Record<string, string>; withCredentials?: boolean }) => unknown }[] }).handlers[0].fulfilled;
    const cfg = await reqInterceptor({ headers: {} }) as { headers: Record<string, string>; withCredentials?: boolean };
    expect(cfg.headers.Authorization).toContain("Bearer ");

    const resErrorInterceptor = (api.interceptors.response as unknown as { handlers: { rejected: (err: unknown) => Promise<never> }[] }).handlers[0].rejected;
    await expect(resErrorInterceptor({ response: { status: 401 } })).rejects.toEqual({ response: { status: 401 } });

    salvarSessaoToken(criarJwtValido(3600));
    vi.spyOn(api, "get").mockResolvedValue({ data: [{ id: "p1", nome: "Arroz", categoria: "Grãos", unidadeMedida: "Kg", saldoTotal: 10 }] });
    vi.spyOn(api, "post").mockResolvedValue({ data: { id: "p2", nome: "Feijão", categoria: "Grãos", unidadeMedida: "Kg", saldoTotal: 0 } });
    vi.spyOn(api, "patch").mockResolvedValue({ data: { id: "p2", nome: "Feijão", categoria: "Grãos", unidadeMedida: "Kg", saldoTotal: 0 } });
    vi.spyOn(api, "delete").mockResolvedValue({ data: undefined });

    expect(await produtoService.listar("Grãos")).toHaveLength(1);
    expect((await produtoService.buscarPorId("p1"))).toBeDefined();
    expect((await produtoService.cadastrar({ nome: "Feijão", categoria: "Grãos", unidadeMedida: "Kg" })).id).toBe("p2");
    await produtoService.atualizarUnidadeMedida("p2", "g");
    await produtoService.atualizarQuantidadeMinima("p2", 15);
    await produtoService.atualizarControleValidade("p2", true);
    await produtoService.atualizarValorReferencia("p2", 8.5);
    await produtoService.excluir("p2");
  });

  it("configura os Security Headers obrigatórios no next.config.js (AppSec #359)", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    const headersMap = Object.fromEntries(
      rules[0].headers.map((h: { key: string; value: string }) => [h.key, h.value])
    );

    expect(headersMap["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headersMap["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(headersMap["X-Content-Type-Options"]).toBe("nosniff");
    expect(headersMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headersMap["Permissions-Policy"]).toContain("camera=()");
  });
});
