package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do RBAC (#68/US02): GET /api/auth/me e
 * a aplicação de @PreAuthorize por perfil em endpoints já existentes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class RbacIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private static final String PRODUTO_VALIDO = """
            {"nome":"Arroz","categoria":"Secos","unidadeMedida":"kg","origem":"EXTERNA"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    private Usuario criarUsuario(String email, Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário Teste " + perfil);
        usuario.setEmail(email);
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }

    private String tokenPara(Usuario usuario) {
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    @Test
    void deveRetornar200ComOsProprioDadosParaQualquerPerfilAutenticado() throws Exception {
        Usuario usuario = criarUsuario("cozinha@ifpe.edu.br", Perfil.COZINHA);
        String token = tokenPara(usuario);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("cozinha@ifpe.edu.br"))
                .andExpect(jsonPath("$.perfil").value("COZINHA"));
    }

    @Test
    void deveRetornar401QuandoSemTokenAoConsultarProprioUsuario() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornar401QuandoTokenInvalidoAoConsultarProprioUsuario() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornar403QuandoCozinhaTentaCriarProduto() throws Exception {
        Usuario usuario = criarUsuario("cozinha.produto@ifpe.edu.br", Perfil.COZINHA);
        String token = tokenPara(usuario);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUTO_VALIDO))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarQuandoNutricionistaCriaProduto() throws Exception {
        Usuario usuario = criarUsuario("nutricionista.produto@ifpe.edu.br", Perfil.NUTRICIONISTA);
        String token = tokenPara(usuario);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUTO_VALIDO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Arroz"));
    }
}
