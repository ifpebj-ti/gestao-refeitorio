package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.SetorProdutivoRepository;
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
 * Testes de integração ponta a ponta do registro de recebimento da produção
 * interna (US13/#142), cobrindo os critérios de aceite da #143.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class ProducaoInternaControllerIntegrationTest {

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
    private SetorProdutivoRepository setorProdutivoRepository;

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
        produto.setNome("Alface");
        produto.setCategoria("Hortaliças");
        produto.setUnidadeMedida("kg");
        return produtoRepository.save(produto);
    }

    private LocalArmazenamento criarLocal() {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Despensa " + UUID.randomUUID());
        return localArmazenamentoRepository.save(local);
    }

    private String corpoValido(UUID produtoId, UUID localId, String setorOrigem, String responsavelSetor) {
        return """
                {"produtoId":"%s","localId":"%s","quantidade":5,"data":"2026-01-10","setorOrigem":"%s","responsavelSetor":"%s"}
                """.formatted(produtoId, localId, setorOrigem, responsavelSetor);
    }

    @Test
    void deveRegistrarRecebimentoComSucesso() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId(), "Horta", "João da Horta")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantidade").value(5))
                .andExpect(jsonPath("$.setorOrigem").value("Horta"))
                .andExpect(jsonPath("$.responsavelSetor").value("João da Horta"))
                .andExpect(jsonPath("$.saldoAtual").value(5));
    }

    @Test
    void deveRetornar400QuandoCamposObrigatoriosAusentes() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(post("/api/producoes-internas")
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

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId(), "Horta", "João")))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarQuandoPerfilNutricionista() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId(), "Horta", "João")))
                .andExpect(status().isCreated());
    }

    @Test
    void deveRetornar404QuandoProdutoInexistente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(UUID.randomUUID(), local.getId(), "Horta", "João")))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar404QuandoLocalInexistente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), UUID.randomUUID(), "Horta", "João")))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveExibirSetorEResponsavelNoHistoricoDoProduto() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId(), "Horta", "João da Horta")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/produtos/" + produto.getId() + "/movimentacoes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].origem").value("INTERNA"))
                .andExpect(jsonPath("$[0].setorOrigem").value("Horta"))
                .andExpect(jsonPath("$[0].responsavelSetor").value("João da Horta"));
    }

    @Test
    void deveReaproveitarMesmoSetorParaNomesComCasingDiferente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();
        String nomeSetor = "Horta-" + UUID.randomUUID();

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId(), nomeSetor.toLowerCase(), "João")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/producoes-internas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId(), nomeSetor.toUpperCase(), "Maria")))
                .andExpect(status().isCreated());

        long quantidadeDeSetoresComEsseNome = setorProdutivoRepository.findAll().stream()
                .filter(setor -> setor.getNome().equalsIgnoreCase(nomeSetor))
                .count();
        assertThat(quantidadeDeSetoresComEsseNome).isEqualTo(1);
    }
}
