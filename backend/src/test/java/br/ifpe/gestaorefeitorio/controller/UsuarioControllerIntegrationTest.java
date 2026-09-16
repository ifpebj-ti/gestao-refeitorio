package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.GoogleTokenValidator;
import br.ifpe.gestaorefeitorio.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do CRUD de usuários (US03/#71), cobrindo
 * os critérios de aceite da #72: cadastro, edição, desativação e a restrição
 * de que só o perfil ADMIN acessa esses endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class UsuarioControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private GoogleTokenValidator googleTokenValidator;

    private Usuario criarUsuario(String email, Perfil perfil, boolean ativo) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(email);
        usuario.setPerfil(perfil);
        usuario.setAtivo(ativo);
        return usuarioRepository.save(usuario);
    }

    private String tokenPara(Usuario usuario) {
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private String tokenAdmin() {
        return tokenPara(criarUsuario("admin" + UUID.randomUUID() + "@ifpe.edu.br", Perfil.ADMIN, true));
    }

    @Test
    void deveRetornar201AoCadastrarUsuarioValido() throws Exception {
        String token = tokenAdmin();

        mockMvc.perform(post("/api/usuarios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Ana Cozinha","email":"ana.nova@ifpe.edu.br","perfil":"COZINHA"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("ana.nova@ifpe.edu.br"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    void deveRetornar409AoCadastrarEmailDuplicado() throws Exception {
        String token = tokenAdmin();
        criarUsuario("duplicado@ifpe.edu.br", Perfil.COZINHA, true);

        mockMvc.perform(post("/api/usuarios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Outro","email":"duplicado@ifpe.edu.br","perfil":"NUTRICIONISTA"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRetornar400AoCadastrarComCorpoInvalido() throws Exception {
        String token = tokenAdmin();

        mockMvc.perform(post("/api/usuarios")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"","email":"","perfil":null}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveListarUsuarios() throws Exception {
        String token = tokenAdmin();
        criarUsuario("listagem@ifpe.edu.br", Perfil.COZINHA, true);

        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void deveBuscarUsuarioPorId() throws Exception {
        String token = tokenAdmin();
        Usuario usuario = criarUsuario("busca@ifpe.edu.br", Perfil.NUTRICIONISTA, true);

        mockMvc.perform(get("/api/usuarios/" + usuario.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("busca@ifpe.edu.br"));
    }

    @Test
    void deveRetornar404AoBuscarIdInexistente() throws Exception {
        String token = tokenAdmin();

        mockMvc.perform(get("/api/usuarios/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveEditarUsuario() throws Exception {
        String token = tokenAdmin();
        Usuario usuario = criarUsuario("editar@ifpe.edu.br", Perfil.COZINHA, true);

        mockMvc.perform(patch("/api/usuarios/" + usuario.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Nome Editado","perfil":"NUTRICIONISTA"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Nome Editado"))
                .andExpect(jsonPath("$.perfil").value("NUTRICIONISTA"));
    }

    @Test
    void deveRetornar404AoEditarIdInexistente() throws Exception {
        String token = tokenAdmin();

        mockMvc.perform(patch("/api/usuarios/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Nome","perfil":"ADMIN"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveDesativarUsuarioENegarLoginDepois() throws Exception {
        String tokenAdmin = tokenAdmin();
        Usuario alvo = criarUsuario("desativar@ifpe.edu.br", Perfil.COZINHA, true);

        mockMvc.perform(patch("/api/usuarios/" + alvo.getId() + "/desativar")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail("desativar@ifpe.edu.br");
        when(googleTokenValidator.validar("token-google-valido")).thenReturn(payload);

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idToken":"token-google-valido"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar409AoTentarAutodesativar() throws Exception {
        Usuario admin = criarUsuario("autodesativar@ifpe.edu.br", Perfil.ADMIN, true);
        String token = tokenPara(admin);

        mockMvc.perform(patch("/api/usuarios/" + admin.getId() + "/desativar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRetornar404AoDesativarIdInexistente() throws Exception {
        String token = tokenAdmin();

        mockMvc.perform(patch("/api/usuarios/" + UUID.randomUUID() + "/desativar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar403QuandoPerfilNaoAdminAcessaUsuarios() throws Exception {
        Usuario cozinha = criarUsuario("cozinha.usuarios@ifpe.edu.br", Perfil.COZINHA, true);
        String token = tokenPara(cozinha);

        mockMvc.perform(get("/api/usuarios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
