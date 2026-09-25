package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do relatório mensal consolidado de
 * estoque (US19/#160, critérios de aceite da #161), da exportação em
 * PDF/Excel (US20/#163, critérios de aceite da #164) e do gráfico de consumo
 * por período (US21/#166, critérios de aceite da #168).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class RelatorioControllerIntegrationTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @Autowired
    private JwtService jwtService;

    private Usuario criarUsuario(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil + "-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }

    private String tokenPara(Perfil perfil) {
        Usuario usuario = criarUsuario(perfil);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private Produto criarProduto(String nome) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        return produtoRepository.save(produto);
    }

    private LocalArmazenamento criarLocal() {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Despensa " + UUID.randomUUID());
        return localArmazenamentoRepository.save(local);
    }

    private void registrarEntrada(String token, UUID produtoId, UUID localId, String quantidade, String data,
            String valor) throws Exception {
        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":%s,"data":"%s","origem":"EXTERNA","valor":%s}
                                """.formatted(produtoId, localId, quantidade, data, valor)))
                .andExpect(status().isCreated());
    }

    private void registrarSaida(String token, UUID produtoId, UUID localId, String quantidade, String data)
            throws Exception {
        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":%s,"data":"%s","tipoSaida":"CONSUMO"}
                                """.formatted(produtoId, localId, quantidade, data)))
                .andExpect(status().isCreated());
    }

    private void registrarProducaoInterna(String token, UUID produtoId, UUID localId, String quantidade, String data)
            throws Exception {
        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":%s,"data":"%s","setorOrigem":"Horta","responsavelSetor":"João"}
                                """.formatted(produtoId, localId, quantidade, data)))
                .andExpect(status().isCreated());
    }

    @Test
    void deveRetornar200ComTotaisCorretosPorProduto() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Arroz");
        LocalArmazenamento local = criarLocal();

        registrarEntrada(token, produto.getId(), local.getId(), "20", "2026-01-10", "100.00");
        registrarSaida(token, produto.getId(), local.getId(), "5", "2026-01-15");
        registrarProducaoInterna(token, produto.getId(), local.getId(), "8", "2026-01-20");

        mockMvc.perform(get("/api/relatorios/mensal")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].produtoId").value(produto.getId().toString()))
                .andExpect(jsonPath("$[0].quantidadeEntradas").value(28))
                .andExpect(jsonPath("$[0].quantidadeSaidas").value(5))
                .andExpect(jsonPath("$[0].quantidadeProducaoInterna").value(8))
                .andExpect(jsonPath("$[0].valorEntradas").value(100.00))
                .andExpect(jsonPath("$[0].saldoFinal").value(23));
    }

    @Test
    void deveRetornarSaldoFinalConsiderandoEntradaAnteriorAoPeriodo() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Feijão");
        LocalArmazenamento local = criarLocal();

        registrarEntrada(token, produto.getId(), local.getId(), "10", "2025-12-01", "50.00"); // antes do período
        registrarEntrada(token, produto.getId(), local.getId(), "5", "2026-01-10", "25.00"); // dentro do período

        mockMvc.perform(get("/api/relatorios/mensal")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].quantidadeEntradas").value(5))
                .andExpect(jsonPath("$[0].saldoFinal").value(15));
    }

    @Test
    void deveExcluirProdutoSemMovimentacaoNoPeriodo() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produtoComMovimentacao = criarProduto("Arroz");
        Produto produtoSemMovimentacao = criarProduto("Feijão");
        LocalArmazenamento local = criarLocal();

        registrarEntrada(token, produtoComMovimentacao.getId(), local.getId(), "10", "2026-01-10", "50.00");

        mockMvc.perform(get("/api/relatorios/mensal")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].produtoId").value(produtoComMovimentacao.getId().toString()));
    }

    @Test
    void deveRetornar400QuandoDataFimAnteriorADataInicio() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/relatorios/mensal")
                        .param("dataInicio", "2026-01-31")
                        .param("dataFim", "2026-01-01")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400QuandoParametrosDePeriodoAusentes() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/relatorios/mensal")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar403QuandoPerfilCozinha() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(get("/api/relatorios/mensal")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar403QuandoPerfilAdmin() throws Exception {
        String token = tokenPara(Perfil.ADMIN);

        mockMvc.perform(get("/api/relatorios/mensal")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarConsultaComPerfilNutricionista() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/relatorios/mensal")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void deveRetornar200ComPdfNaoVazio() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Arroz");
        LocalArmazenamento local = criarLocal();
        registrarEntrada(token, produto.getId(), local.getId(), "10", "2026-01-10", "50.00");

        var resultado = mockMvc.perform(get("/api/relatorios/mensal/pdf")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString(".pdf")))
                .andReturn();

        assertThat(resultado.getResponse().getContentAsByteArray()).isNotEmpty();
    }

    @Test
    void deveRetornar200ComExcelNaoVazio() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Arroz");
        LocalArmazenamento local = criarLocal();
        registrarEntrada(token, produto.getId(), local.getId(), "10", "2026-01-10", "50.00");

        var resultado = mockMvc.perform(get("/api/relatorios/mensal/excel")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString(".xlsx")))
                .andReturn();

        assertThat(resultado.getResponse().getContentAsByteArray()).isNotEmpty();
    }

    @Test
    void deveRetornar400NaExportacaoQuandoDataFimAnteriorADataInicio() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/relatorios/mensal/pdf")
                        .param("dataInicio", "2026-01-31")
                        .param("dataFim", "2026-01-01")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/relatorios/mensal/excel")
                        .param("dataInicio", "2026-01-31")
                        .param("dataFim", "2026-01-01")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar403NaExportacaoComPerfilCozinha() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(get("/api/relatorios/mensal/pdf")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/relatorios/mensal/excel")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar403NaExportacaoComPerfilAdmin() throws Exception {
        String token = tokenPara(Perfil.ADMIN);

        mockMvc.perform(get("/api/relatorios/mensal/pdf")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/relatorios/mensal/excel")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar200ComConsumoAgregadoPorDiaSomandoProdutosDiferentes() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto arroz = criarProduto("Arroz");
        Produto feijao = criarProduto("Feijão");
        LocalArmazenamento local = criarLocal();

        registrarEntrada(token, arroz.getId(), local.getId(), "20", "2026-01-01", "50.00");
        registrarEntrada(token, feijao.getId(), local.getId(), "10", "2026-01-01", "30.00");
        registrarSaida(token, arroz.getId(), local.getId(), "10", "2026-01-10");
        registrarSaida(token, feijao.getId(), local.getId(), "4", "2026-01-10");
        registrarSaida(token, arroz.getId(), local.getId(), "3", "2026-01-20");

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].data").value("2026-01-10"))
                .andExpect(jsonPath("$[0].quantidade").value(14))
                .andExpect(jsonPath("$[1].data").value("2026-01-20"))
                .andExpect(jsonPath("$[1].quantidade").value(3));
    }

    @Test
    void deveRetornar200ComConsumoFiltradoPorProduto() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto arroz = criarProduto("Arroz");
        Produto feijao = criarProduto("Feijão");
        LocalArmazenamento local = criarLocal();

        registrarEntrada(token, arroz.getId(), local.getId(), "20", "2026-01-01", "50.00");
        registrarEntrada(token, feijao.getId(), local.getId(), "10", "2026-01-01", "30.00");
        registrarSaida(token, arroz.getId(), local.getId(), "10", "2026-01-10");
        registrarSaida(token, feijao.getId(), local.getId(), "4", "2026-01-10");

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .param("produtoId", arroz.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].quantidade").value(10));
    }

    @Test
    void deveExcluirSaidasQueNaoSaoConsumoDoGrafico() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Arroz");
        LocalArmazenamento local = criarLocal();

        registrarEntrada(token, produto.getId(), local.getId(), "20", "2026-01-01", "50.00");
        registrarSaida(token, produto.getId(), local.getId(), "10", "2026-01-10");
        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":6,"data":"2026-01-10","tipoSaida":"PERDA"}
                                """.formatted(produto.getId(), local.getId())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].quantidade").value(10));
    }

    @Test
    void deveRetornar404NoGraficoQuandoProdutoIdInexistente() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .param("produtoId", UUID.randomUUID().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar400NoGraficoQuandoDataFimAnteriorADataInicio() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-31")
                        .param("dataFim", "2026-01-01")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar403NoGraficoComPerfilCozinha() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar403NoGraficoComPerfilAdmin() throws Exception {
        String token = tokenPara(Perfil.ADMIN);

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarGraficoDeConsumoComPerfilNutricionista() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/relatorios/consumo")
                        .param("dataInicio", "2026-01-01")
                        .param("dataFim", "2026-01-31")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
