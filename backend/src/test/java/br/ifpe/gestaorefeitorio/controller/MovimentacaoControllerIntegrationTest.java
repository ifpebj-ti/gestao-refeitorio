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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do registro de entrada de produto
 * (US07/#84), cobrindo os critérios de aceite da #86.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class MovimentacaoControllerIntegrationTest {

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

    private Produto criarProduto() {
        Produto produto = new Produto();
        produto.setNome("Arroz");
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        return produtoRepository.save(produto);
    }

    private LocalArmazenamento criarLocal() {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Despensa " + UUID.randomUUID());
        return localArmazenamentoRepository.save(local);
    }

    private String corpoValido(UUID produtoId, UUID localId) {
        return """
                {"produtoId":"%s","localId":"%s","quantidade":10,"data":"2026-01-10","origem":"EXTERNA","valor":50.00}
                """.formatted(produtoId, localId);
    }

    @Test
    void deveRetornar201AoRegistrarEntradaValidaEAumentarSaldo() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("ENTRADA"))
                .andExpect(jsonPath("$.quantidade").value(10))
                .andExpect(jsonPath("$.saldoAtual").value(10));
    }

    @Test
    void deveRetornar404QuandoProdutoInexistente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(UUID.randomUUID(), local.getId())))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar404QuandoLocalInexistente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), UUID.randomUUID())))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar400QuandoQuantidadeZeroOuNegativa() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":0,"data":"2026-01-10","origem":"EXTERNA","valor":50.00}
                                """.formatted(produto.getId(), local.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400QuandoCamposObrigatoriosAusentes() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar403QuandoPerfilAdmin() throws Exception {
        String token = tokenPara(Perfil.ADMIN);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarQuandoPerfilNutricionista() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId())))
                .andExpect(status().isCreated());
    }
}
