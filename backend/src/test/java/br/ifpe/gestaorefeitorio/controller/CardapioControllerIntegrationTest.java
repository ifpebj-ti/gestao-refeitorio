package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.CardapioRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do cadastro de cardápio com projeção de
 * consumo (US17/#154), cobrindo os critérios de aceite da #155.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class CardapioControllerIntegrationTest {

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
    private CardapioRepository cardapioRepository;

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

    private Produto criarProduto() {
        Produto produto = new Produto();
        produto.setNome("Arroz");
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        return produtoRepository.save(produto);
    }

    private String corpoValido(UUID produtoId) {
        return """
                {"refeicao":"Almoço","data":"2026-01-10","pessoasEstimadas":50,
                 "itens":[{"produtoId":"%s","quantidadePorPessoa":0.200}]}
                """.formatted(produtoId);
    }

    @Test
    void deveRegistrarCardapioComSucesso() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/cardapios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.refeicao").value("Almoço"))
                .andExpect(jsonPath("$.pessoasEstimadas").value(50))
                .andExpect(jsonPath("$.itens.length()").value(1))
                .andExpect(jsonPath("$.itens[0].produtoId").value(produto.getId().toString()))
                .andExpect(jsonPath("$.itens[0].projecaoConsumo").value(10.0));
    }

    @Test
    void deveRetornar400QuandoItensVazio() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/cardapios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refeicao":"Almoço","data":"2026-01-10","pessoasEstimadas":50,"itens":[]}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400QuandoCamposObrigatoriosAusentes() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/cardapios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar404ENaoPersistirQuandoItemComProdutoInexistente() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/cardapios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(UUID.randomUUID())))
                .andExpect(status().isNotFound());

        assertThat(cardapioRepository.findAll()).isEmpty();
    }

    @Test
    void deveRetornar403QuandoPerfilCozinha() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/cardapios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar403QuandoPerfilAdmin() throws Exception {
        String token = tokenPara(Perfil.ADMIN);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/cardapios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarConsultaParaQualquerPerfilAutenticado() throws Exception {
        String tokenNutricionista = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/cardapios")
                        .header("Authorization", "Bearer " + tokenNutricionista)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId())))
                .andExpect(status().isCreated());

        String tokenCozinha = tokenPara(Perfil.COZINHA);
        mockMvc.perform(get("/api/cardapios")
                        .header("Authorization", "Bearer " + tokenCozinha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void deveRetornar404AoConsultarCardapioInexistente() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/cardapios/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
