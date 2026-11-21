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
  obterCsrfToken,
  obterHeadersAutenticados,
  possuiSessaoAtiva,
  STORAGE_TOKEN_KEY,
  SESSION_TOKEN_KEY,
  STORAGE_USER_KEY,
  STORAGE_PERFIL_KEY,
  EVENTO_SESSAO_EXPIRADA,
} from "@/lib/authSession";
import { middleware, isRotaProtegida } from "@/middleware";
import { NextRequest } from "next/server";
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
  validarPeriodoRelatorio,
} from "@/lib/relatorios";
import { produtoService, validarDadosProduto } from "@/lib/produtos";
import { validarCardapioSemanal } from "@/app/cardapio/page";
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

  it("mantém o token apenas em memória, nunca espelha no sessionStorage/localStorage e purga resíduos (#422)", () => {
    localStorage.setItem(STORAGE_TOKEN_KEY, "token-antigo-inseguro");
    sessionStorage.setItem(SESSION_TOKEN_KEY, "token-sessao-legado");

    const tokenValido = criarJwtValido(3600);
    salvarSessaoToken(tokenValido);

    expect(localStorage.getItem(STORAGE_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_TOKEN_KEY)).toBeNull();
    expect(getToken()).toBe(tokenValido);
    expect(possuiSessaoAtiva()).toBe(true);

    document.cookie = "XSRF-TOKEN=csrf-123; Path=/";
    expect(obterCsrfToken()).toBe("csrf-123");
    const headers = obterHeadersAutenticados({ "Content-Type": "application/json" });
    expect(headers["X-XSRF-TOKEN"]).toBe("csrf-123");
    expect(headers.Authorization).toBe(`Bearer ${tokenValido}`);

    salvarSessaoToken(null);
    expect(getToken()).toBeNull();
    expect(sessionStorage.getItem(SESSION_TOKEN_KEY)).toBeNull();
  });

  it("limpa sessão e dispara evento quando token em memória expira ou ocorre 401", () => {
    const listener = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, listener);

    const tokenExpirado = criarJwtValido(-120);
    salvarSessaoToken(tokenExpirado);
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

  it("mantém a CSP exclusivamente na borda e configura os demais headers, cache de TV e anti-fingerprinting (#359, #381, #427, #428, #429)", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.productionBrowserSourceMaps).toBe(false);
    expect(nextConfig.images?.unoptimized).toBe(true);

    const prodRules = await nextConfig.headers!();
    expect(prodRules).toHaveLength(3);

    const tvRule = prodRules.find((r: { source: string }) => r.source === "/tv");
    const tvWildcardRule = prodRules.find((r: { source: string }) => r.source === "/tv/:path*");
    const globalRule = prodRules.find((r: { source: string }) => r.source === "/(.*)");

    expect(tvRule?.headers[0].key).toBe("Cache-Control");
    expect(tvRule?.headers[0].value).toContain("no-store");
    expect(tvRule?.headers[0].value).toContain("s-maxage=0");
    expect(tvWildcardRule?.headers[0].value).toContain("s-maxage=0");

    const prodHeadersMap = Object.fromEntries(
      globalRule!.headers.map((h: { key: string; value: string }) => [h.key, h.value])
    );

    expect(prodHeadersMap).not.toHaveProperty("Content-Security-Policy");
    expect(prodHeadersMap["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(prodHeadersMap["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(prodHeadersMap["X-Content-Type-Options"]).toBe("nosniff");
    expect(prodHeadersMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(prodHeadersMap["Permissions-Policy"]).toContain("camera=()");

    const devRules = await nextConfig.headers!();
    const devGlobalRule = devRules.find((r: { source: string }) => r.source === "/(.*)");
    const devHeadersMap = Object.fromEntries(
      devGlobalRule!.headers.map((h: { key: string; value: string }) => [h.key, h.value])
    );
    expect(devHeadersMap).not.toHaveProperty("Content-Security-Policy");
  });

  it("protege rotas autenticadas no servidor com middleware.ts e libera rotas públicas (#423)", () => {
    expect(isRotaProtegida("/")).toBe(false);
    expect(isRotaProtegida("/tv")).toBe(false);
    expect(isRotaProtegida("/tv/refeitorio")).toBe(false);
    expect(isRotaProtegida("/usuarios")).toBe(true);
    expect(isRotaProtegida("/admin/usuarios")).toBe(true);
    expect(isRotaProtegida("/estoque")).toBe(true);
    expect(isRotaProtegida("/consumo")).toBe(true);

    // 1. Acesso anônimo a rota protegida (/admin/usuarios) -> redireciona (307) para /
    const reqAnonima = new NextRequest("https://gestao-refeitorio-ifpe.duckdns.org/admin/usuarios");
    const resAnonima = middleware(reqAnonima);
    expect(resAnonima.status).toBe(307);
    expect(resAnonima.headers.get("location")).toBe("https://gestao-refeitorio-ifpe.duckdns.org/");

    // 2. Acesso com cookie HttpOnly token -> permite prosseguir (200)
    const reqComCookie = new NextRequest("https://gestao-refeitorio-ifpe.duckdns.org/usuarios", {
      headers: { cookie: "token=jwt-cookie-http-only" },
    });
    const resComCookie = middleware(reqComCookie);
    expect(resComCookie.status).toBe(200);

    // 3. Acesso anônimo a rota pública (/tv/refeitorio) -> permite prosseguir (200)
    const reqPublica = new NextRequest("https://gestao-refeitorio-ifpe.duckdns.org/tv/refeitorio");
    const resPublica = middleware(reqPublica);
    expect(resPublica.status).toBe(200);
  });

  it("valida intervalo máximo de 12 meses (366 dias) e ordem de datas nos Relatórios (#451 / B-07)", async () => {
    expect(() => validarPeriodoRelatorio("", "2026-11-30")).toThrow(
      "Informe a data inicial e a data final do período."
    );
    expect(() => validarPeriodoRelatorio("data-invalida", "2026-11-30")).toThrow(
      "Período inválido"
    );
    expect(() => validarPeriodoRelatorio("2026-12-01", "2026-11-01")).toThrow(
      "A data inicial não pode ser posterior à data final."
    );
    expect(() => validarPeriodoRelatorio("2020-01-01", "2026-11-30")).toThrow(
      "O período máximo permitido para consulta e exportação de relatórios é de 12 meses (366 dias)."
    );

    await expect(buscarRelatorioMensal("1000-01-01", "9999-12-31")).rejects.toThrow(
      "12 meses (366 dias)"
    );
    await expect(exportarRelatorioPdf("1000-01-01", "9999-12-31")).rejects.toThrow(
      "12 meses (366 dias)"
    );
    await expect(exportarRelatorioExcel("1000-01-01", "9999-12-31")).rejects.toThrow(
      "12 meses (366 dias)"
    );
    await expect(buscarGraficoConsumo("2026-12-10", "2026-11-10")).rejects.toThrow(
      "A data inicial não pode ser posterior à data final."
    );

    expect(() => validarPeriodoRelatorio("2026-01-01", "2026-12-31")).not.toThrow();
  });

  it("valida limites de grandeza, tamanho de campos e unicidade no Catálogo de Produtos e no Cardápio Semanal (#450 / A-01, A-02, M-10, B-06)", async () => {
    const catalogo = [{ id: "p1", nome: "Arroz Parboilizado" }];

    // 1. Unicidade de nome de produto case-insensitive (A-01)
    expect(() =>
      validarDadosProduto({ nome: "  arroz parboilizado  ", unidadeMedida: "Kg" }, catalogo)
    ).toThrow("Já existe um insumo cadastrado com este nome no catálogo.");

    await expect(
      produtoService.cadastrar(
        { nome: "ARROZ PARBOILIZADO", categoria: "Grãos", unidadeMedida: "Kg" },
        catalogo
      )
    ).rejects.toThrow("Já existe um insumo cadastrado com este nome no catálogo.");

    // 2. Tamanho de VARCHAR e magnitude de NUMERIC em produtos (B-06 / M-10)
    expect(() =>
      validarDadosProduto({ nome: "A".repeat(101), unidadeMedida: "Kg" })
    ).toThrow("no máximo 100 caracteres");
    expect(() =>
      validarDadosProduto({ nome: "Arroz", unidadeMedida: "U".repeat(25) })
    ).toThrow("no máximo 20 caracteres");
    expect(() =>
      validarDadosProduto({ valorReferencia: 2_000_000 })
    ).toThrow("entre R$ 0,01 e R$ 999.999,99");
    expect(() =>
      validarDadosProduto({ quantidadeMinima: 5_000_000 })
    ).toThrow("entre 0 e 999.999,99");

    // 3. Cardápio Semanal: item duplicado na mesma refeição (A-02) e grandeza de pessoasEstimadas / quantidade (M-10)
    const refeicaoVazia = { texto: "", quantidadePessoas: "", observacoes: "", itens: [], itensSalada: [] };
    const criarGradeBase = () => ({
      Segunda: { cafe: { ...refeicaoVazia }, almoco: { ...refeicaoVazia }, jantar: { ...refeicaoVazia } },
      Terça: { cafe: { ...refeicaoVazia }, almoco: { ...refeicaoVazia }, jantar: { ...refeicaoVazia } },
      Quarta: { cafe: { ...refeicaoVazia }, almoco: { ...refeicaoVazia }, jantar: { ...refeicaoVazia } },
      Quinta: { cafe: { ...refeicaoVazia }, almoco: { ...refeicaoVazia }, jantar: { ...refeicaoVazia } },
      Sexta: { cafe: { ...refeicaoVazia }, almoco: { ...refeicaoVazia }, jantar: { ...refeicaoVazia } },
    });

    const gradeDuplicada = criarGradeBase();
    gradeDuplicada.Segunda.almoco.texto = "- Arroz (10 kg)\n- Feijão (5 kg)\n- ARROZ (8 kg)";
    const resDuplicado = validarCardapioSemanal(gradeDuplicada);
    expect(resDuplicado.valido).toBe(false);
    expect(resDuplicado.erro).toContain("Item duplicado em Segunda (Almoço)");

    const gradePessoasExcesso = criarGradeBase();
    gradePessoasExcesso.Terça.cafe.quantidadePessoas = "2000000000";
    const resPessoas = validarCardapioSemanal(gradePessoasExcesso);
    expect(resPessoas.valido).toBe(false);
    expect(resPessoas.erro).toContain("entre 1 e 10.000");

    const gradeQtdExcesso = criarGradeBase();
    gradeQtdExcesso.Quarta.jantar.texto = "- Carne Bovina (999999999 kg)";
    const resQtd = validarCardapioSemanal(gradeQtdExcesso);
    expect(resQtd.valido).toBe(false);
    expect(resQtd.erro).toContain("entre 0,001 e 100.000");

    const gradeValida = criarGradeBase();
    gradeValida.Segunda.almoco.quantidadePessoas = "350";
    gradeValida.Segunda.almoco.texto = "Salada: Alface + Tomate\n- Arroz (25 kg)\n- Feijão (15 kg)";
    expect(validarCardapioSemanal(gradeValida)).toEqual({ valido: true });
  });
});
