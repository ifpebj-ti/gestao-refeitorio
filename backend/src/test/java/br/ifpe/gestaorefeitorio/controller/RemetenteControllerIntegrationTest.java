package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.GoogleTokenValidator;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do cadastro de remetentes (US26/#286), cobrindo
 * os critérios de aceite: cadastro, unicidade sem diferenciar maiúsculas/minúsculas,
 * validação do documento, 404, inativação/reativação e restrição ao perfil NUTRICIONISTA.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class RemetenteControllerIntegrationTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RemetenteRepository remetenteRepository;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private GoogleTokenValidator googleTokenValidator;

    private String tokenPara(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil.name().toLowerCase() + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuarioRepository.save(usuario);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private String tokenNutricionista() {
        return tokenPara(Perfil.NUTRICIONISTA);
    }

    private Remetente criarRemetente(String nome, boolean ativo) {
        Remetente remetente = new Remetente();
        remetente.setNome(nome);
        remetente.setAtivo(ativo);
        return remetenteRepository.save(remetente);
    }

    @Test
    void deveRetornar201AoCadastrarRemetenteValido() throws Exception {
        mockMvc.perform(post("/api/remetentes")
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"  Agroindústria  ","documento":"123.456.789-09","contato":"(81) 3411-0000"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nome").value("Agroindústria"))
                .andExpect(jsonPath("$.documento").value("12345678909"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    void deveRetornar201AoCadastrarSoComNome() throws Exception {
        mockMvc.perform(post("/api/remetentes")
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Doador Anônimo"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.documento").doesNotExist());
    }

    @Test
    void deveRetornar409AoCadastrarNomeDuplicadoIgnorandoCaixa() throws Exception {
        criarRemetente("Fornecedor Central", true);

        mockMvc.perform(post("/api/remetentes")
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"FORNECEDOR central"}
                                """))
                .andExpect(status().isConflict());
    }

    @ParameterizedTest
    @ValueSource(strings = { "1234567890", "123456789012", "1234567890123", "123456789012345", "abc.def.ghi-jk" })
    void deveRetornar400QuandoDocumentoNaoTem11Nem14Digitos(String documento) throws Exception {
        mockMvc.perform(post("/api/remetentes")
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Remetente","documento":"%s"}
                                """.formatted(documento)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.documento").exists());
    }

    @Test
    void deveRetornar400QuandoNomeVazio() throws Exception {
        mockMvc.perform(post("/api/remetentes")
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.nome").exists());
    }

    @Test
    void deveListarFiltrandoPorAtivo() throws Exception {
        String token = tokenNutricionista();
        criarRemetente("Remetente Ativo", true);
        criarRemetente("Remetente Inativo", false);

        mockMvc.perform(get("/api/remetentes").param("ativo", "true")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome").value(hasItem("Remetente Ativo")))
                .andExpect(jsonPath("$[*].nome").value(not(hasItem("Remetente Inativo"))));

        mockMvc.perform(get("/api/remetentes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nome").value(hasItem("Remetente Inativo")));
    }

    @Test
    void deveBuscarPorId() throws Exception {
        Remetente remetente = criarRemetente("Setor de Zootecnia", true);

        mockMvc.perform(get("/api/remetentes/" + remetente.getId())
                        .header("Authorization", "Bearer " + tokenNutricionista()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Setor de Zootecnia"));
    }

    @Test
    void deveRetornar404AoBuscarIdInexistente() throws Exception {
        mockMvc.perform(get("/api/remetentes/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenNutricionista()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveEditarRemetente() throws Exception {
        Remetente remetente = criarRemetente("Nome Antigo", true);

        mockMvc.perform(put("/api/remetentes/" + remetente.getId())
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Nome Novo","documento":"12345678000195","contato":"email@fornecedor.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Nome Novo"))
                .andExpect(jsonPath("$.documento").value("12345678000195"))
                .andExpect(jsonPath("$.contato").value("email@fornecedor.com"));
    }

    @Test
    void devePermitirEditarMantendoOProprioNomeComOutraCaixa() throws Exception {
        Remetente remetente = criarRemetente("Cooperativa", true);

        mockMvc.perform(put("/api/remetentes/" + remetente.getId())
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"COOPERATIVA"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("COOPERATIVA"));
    }

    @Test
    void deveRetornar409AoEditarParaNomeDeOutroRemetente() throws Exception {
        criarRemetente("Existente", true);
        Remetente remetente = criarRemetente("Outro", true);

        mockMvc.perform(put("/api/remetentes/" + remetente.getId())
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"existente"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRetornar404AoEditarIdInexistente() throws Exception {
        mockMvc.perform(put("/api/remetentes/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenNutricionista())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Qualquer"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveInativarEReativarRemetente() throws Exception {
        String token = tokenNutricionista();
        Remetente remetente = criarRemetente("Fornecedor Temporário", true);

        mockMvc.perform(patch("/api/remetentes/" + remetente.getId() + "/inativar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));

        mockMvc.perform(patch("/api/remetentes/" + remetente.getId() + "/reativar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    void deveRetornar404AoInativarIdInexistente() throws Exception {
        mockMvc.perform(patch("/api/remetentes/" + UUID.randomUUID() + "/inativar")
                        .header("Authorization", "Bearer " + tokenNutricionista()))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @EnumSource(value = Perfil.class, names = { "COZINHA", "ADMIN" })
    void deveRetornar403ParaPerfilSemPermissao(Perfil perfil) throws Exception {
        String token = tokenPara(perfil);

        mockMvc.perform(get("/api/remetentes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/remetentes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Sem Permissão"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar401SemToken() throws Exception {
        mockMvc.perform(get("/api/remetentes"))
                .andExpect(status().isUnauthorized());
    }
}
