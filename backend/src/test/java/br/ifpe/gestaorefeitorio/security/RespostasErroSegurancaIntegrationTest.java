package br.ifpe.gestaorefeitorio.security;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Respostas 401 e 403 escritas pela cadeia de segurança, fora do GlobalExceptionHandler (#491):
 * JSON em UTF-8 declarado no Content-Type, com acentos corretos e no mesmo formato (timestamp + mensagem).
 * Os bytes são decodificados à mão em UTF-8, como faz um cliente real, sem confiar no charset do MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class RespostasErroSegurancaIntegrationTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    private String tokenNutricionista() {
        Usuario usuario = new Usuario();
        usuario.setNome("Nutricionista UTF-8");
        usuario.setEmail("nutri-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(Perfil.NUTRICIONISTA);
        usuario.setAtivo(true);
        usuarioRepository.save(usuario);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private void conferirJsonUtf8(MockHttpServletResponse resposta, String mensagemEsperada) {
        assertThat(resposta.getContentType()).isEqualToIgnoringCase("application/json;charset=UTF-8");

        String corpo = new String(resposta.getContentAsByteArray(), StandardCharsets.UTF_8);
        assertThat(JsonPath.<String>read(corpo, "$.mensagem")).isEqualTo(mensagemEsperada);
        assertThat(Instant.parse(JsonPath.read(corpo, "$.timestamp"))).isNotNull();
    }

    @Test
    void respostaDe401DeveSerJsonUtf8ComAcentosCorretos() throws Exception {
        MockHttpServletResponse resposta = mockMvc.perform(get("/api/produtos"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse();

        conferirJsonUtf8(resposta, "Autenticação necessária");
    }

    @Test
    void respostaDe401ComTokenInvalidoDeveSerJsonUtf8() throws Exception {
        MockHttpServletResponse resposta = mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse();

        conferirJsonUtf8(resposta, "Autenticação necessária");
    }

    @Test
    void respostaDe403DoCsrfDeveSerJsonUtf8ComAcentosCorretos() throws Exception {
        MockHttpServletResponse resposta = mockMvc.perform(delete("/api/produtos/" + UUID.randomUUID())
                        .cookie(new Cookie("token", tokenNutricionista())))
                .andExpect(status().isForbidden())
                .andReturn().getResponse();

        conferirJsonUtf8(resposta, "Requisição bloqueada pela proteção CSRF");
    }
}
