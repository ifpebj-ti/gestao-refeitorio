package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.exception.TokenGoogleInvalidoException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.GoogleTokenValidator;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta (controller -> service -> repository -> Flyway)
 * do endpoint POST /api/auth/google, cobrindo os critérios de aceite da US01/#62.
 * Mocka apenas o GoogleTokenValidator, que é a única fronteira externa (chamada real ao Google).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class AuthControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @MockBean
    private GoogleTokenValidator googleTokenValidator;

    private GoogleIdToken.Payload payloadComEmail(String email) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail(email);
        return payload;
    }

    private Usuario criarUsuario(String email, Perfil perfil, boolean ativo) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário Teste");
        usuario.setEmail(email);
        usuario.setPerfil(perfil);
        usuario.setAtivo(ativo);
        return usuarioRepository.save(usuario);
    }

    @Test
    void deveRetornar200EJwtQuandoUsuarioCadastradoEAtivo() throws Exception {
        String email = "nutricionista@ifpe.edu.br";
        criarUsuario(email, Perfil.NUTRICIONISTA, true);
        when(googleTokenValidator.validar("token-valido")).thenReturn(payloadComEmail(email));

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idToken":"token-valido"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.perfil").value("NUTRICIONISTA"));
    }

    @Test
    void deveRetornar401QuandoTokenGoogleInvalidoOuExpirado() throws Exception {
        when(googleTokenValidator.validar("token-invalido"))
                .thenThrow(new TokenGoogleInvalidoException());

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idToken":"token-invalido"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornar403QuandoEmailNaoCadastrado() throws Exception {
        String email = "naocadastrado@ifpe.edu.br";
        when(googleTokenValidator.validar("token-valido")).thenReturn(payloadComEmail(email));

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idToken":"token-valido"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar403QuandoUsuarioInativo() throws Exception {
        String email = "cozinha.inativa@ifpe.edu.br";
        criarUsuario(email, Perfil.COZINHA, false);
        when(googleTokenValidator.validar("token-valido")).thenReturn(payloadComEmail(email));

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idToken":"token-valido"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar400QuandoIdTokenAusente() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idToken":""}
                                """))
                .andExpect(status().isBadRequest());
    }
}
