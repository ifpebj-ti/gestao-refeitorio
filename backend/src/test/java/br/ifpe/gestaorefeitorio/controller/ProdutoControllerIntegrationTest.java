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
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do cadastro de produto (US04/#74),
 * cobrindo os critérios de aceite da #75.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class ProdutoControllerIntegrationTest {

    @Container
    @ServiceConnection
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

    private String tokenPara(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil + "-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuario = usuarioRepository.save(usuario);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private Produto criarProduto(String nome, String unidadeMedida) {
        return criarProduto(nome, "Secos", unidadeMedida);
    }

    private Produto criarProduto(String nome, String categoria, String unidadeMedida) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setCategoria(categoria);
        produto.setUnidadeMedida(unidadeMedida);
        return produtoRepository.save(produto);
    }

    private LocalArmazenamento criarLocal() {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Local " + UUID.randomUUID());
        return localArmazenamentoRepository.save(local);
    }

    private void registrarEntrada(String token, UUID produtoId, UUID localId, String quantidade) throws Exception {
        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":%s,"data":"2026-01-10","origem":"EXTERNA","valor":10.00}
                                """.formatted(produtoId, localId, quantidade)))
                .andExpect(status().isCreated());
    }

    private void registrarSaida(String token, UUID produtoId, UUID localId, String quantidade) throws Exception {
        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":%s,"data":"2026-01-10","tipoSaida":"CONSUMO"}
                                """.formatted(produtoId, localId, quantidade)))
                .andExpect(status().isCreated());
    }

    @Test
    void deveRetornar201AoCadastrarProdutoValidoEApareceNaListagem() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":"kg","valorReferencia":8.90}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Arroz"))
                .andExpect(jsonPath("$.unidadeMedida").value("kg"));

        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nome == 'Arroz')]").exists());
    }

    @Test
    void deveRetornar400SemUnidadeMedida() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400SemNomeOuCategoria() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"","categoria":"","unidadeMedida":"kg"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400ComValorReferenciaNegativo() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":"kg","valorReferencia":-5}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar404AoBuscarIdInexistente() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/produtos/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveAutorizarConsultaParaQualquerPerfilAutenticado() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void deveRetornar403QuandoPerfilNaoNutricionistaTentaCadastrar() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":"kg"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar200AoAtualizarUnidadeMedida() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Arroz", "kg");

        mockMvc.perform(patch("/api/produtos/" + produto.getId() + "/unidade-medida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unidadeMedida":"g"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unidadeMedida").value("g"));

        mockMvc.perform(get("/api/produtos/" + produto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.unidadeMedida").value("g"));
    }

    @Test
    void deveRetornar400AoAtualizarUnidadeMedidaComValorEmBranco() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Arroz", "kg");

        mockMvc.perform(patch("/api/produtos/" + produto.getId() + "/unidade-medida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unidadeMedida":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar404AoAtualizarUnidadeMedidaDeIdInexistente() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(patch("/api/produtos/" + UUID.randomUUID() + "/unidade-medida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unidadeMedida":"g"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar403QuandoPerfilNaoNutricionistaAtualizaUnidadeMedida() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto("Arroz", "kg");

        mockMvc.perform(patch("/api/produtos/" + produto.getId() + "/unidade-medida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"unidadeMedida":"g"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveFiltrarListagemPorCategoria() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        criarProduto("Leite", "Frios", "L");
        criarProduto("Arroz", "Secos", "kg");

        mockMvc.perform(get("/api/produtos").param("categoria", "Frios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nome == 'Leite')]").exists())
                .andExpect(jsonPath("$[?(@.nome == 'Arroz')]").doesNotExist());
    }

    @Test
    void deveFiltrarListagemPorCategoriaSemDiferenciarMaiusculas() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        criarProduto("Leite", "Frios", "L");

        mockMvc.perform(get("/api/produtos").param("categoria", "frios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nome == 'Leite')]").exists());
    }

    @Test
    void deveListarTodosQuandoSemParametroDeCategoria() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        criarProduto("Leite", "Frios", "L");
        criarProduto("Arroz", "Secos", "kg");

        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nome == 'Leite')]").exists())
                .andExpect(jsonPath("$[?(@.nome == 'Arroz')]").exists());
    }

    @Test
    void deveRetornarListaVaziaQuandoCategoriaSemCorrespondencia() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/produtos").param("categoria", "Bebidas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void deveRetornarSaldoTotalCorretoAposEntradasESaidas() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto("Arroz", "Secos", "kg");
        LocalArmazenamento local = criarLocal();

        registrarEntrada(token, produto.getId(), local.getId(), "10");
        registrarSaida(token, produto.getId(), local.getId(), "4");

        mockMvc.perform(get("/api/produtos/" + produto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldoTotal").value(6));
    }

    @Test
    void deveRetornarSaldoZeroQuandoProdutoSemMovimentacoes() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Feijão", "Secos", "kg");

        mockMvc.perform(get("/api/produtos/" + produto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldoTotal").value(0));
    }

    @Test
    void deveRetornarSaldoPorLocalComLocaisDiferentes() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto("Arroz", "Secos", "kg");
        LocalArmazenamento despensa = criarLocal();
        LocalArmazenamento congelados = criarLocal();

        registrarEntrada(token, produto.getId(), despensa.getId(), "10");
        registrarEntrada(token, produto.getId(), congelados.getId(), "5");

        mockMvc.perform(get("/api/produtos/" + produto.getId() + "/saldo-por-local")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.localId == '" + despensa.getId() + "')].saldo").value(10.0))
                .andExpect(jsonPath("$[?(@.localId == '" + congelados.getId() + "')].saldo").value(5.0));
    }

    @Test
    void deveRetornarListaVaziaDeSaldoPorLocalQuandoSemMovimentacoes() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto("Feijão", "Secos", "kg");

        mockMvc.perform(get("/api/produtos/" + produto.getId() + "/saldo-por-local")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void deveRetornar404AoConsultarSaldoPorLocalDeProdutoInexistente() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/produtos/" + UUID.randomUUID() + "/saldo-por-local")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveAutorizarConsultaDeSaldoPorLocalParaQualquerPerfilAutenticado() throws Exception {
        String tokenAdmin = tokenPara(Perfil.ADMIN);
        Produto produto = criarProduto("Feijão", "Secos", "kg");

        mockMvc.perform(get("/api/produtos/" + produto.getId() + "/saldo-por-local")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
    }
}
