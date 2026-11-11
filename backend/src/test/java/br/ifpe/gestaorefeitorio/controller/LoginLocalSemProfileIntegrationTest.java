package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sem o profile seguranca (como em produção), o login local não existe (#298).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class LoginLocalSemProfileIntegrationTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void naoDeveExistirLoginLocalNemUsuariosDeTesteSemOProfile() throws Exception {
        assertThat(applicationContext.getBeanNamesForType(LoginLocalController.class)).isEmpty();

        mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nutricionista@seguranca.local\",\"senha\":\"qualquer-senha-123\"}"))
                .andExpect(status().isUnauthorized());

        assertThat(usuarioRepository.findAll())
                .noneMatch(usuario -> usuario.getEmail().endsWith("@seguranca.local"));
    }
}
