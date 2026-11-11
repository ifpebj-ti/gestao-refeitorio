package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.service.LoginLocalService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
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
 * Login local do profile seguranca (#298), ponta a ponta: o token emitido vale nos endpoints
 * reais, o RBAC continua valendo e falhas de credencial dão o mesmo 401 genérico.
 */
@SpringBootTest(properties = {
        "seguranca.login-local.nutricionista.senha=senha-nutri-teste-123",
        "seguranca.login-local.cozinha.senha=senha-cozinha-teste-123"
})
@AutoConfigureMockMvc
@ActiveProfiles("seguranca")
@Testcontainers
class LoginLocalIntegrationTest {

    private static final String NUTRI = "nutricionista@seguranca.local";
    private static final String COZINHA = "cozinha@seguranca.local";

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private LoginLocalService loginLocalService;

    private String corpoLogin(String email, String senha) {
        return """
                {"email":"%s","senha":"%s"}
                """.formatted(email, senha);
    }

    private String tokenDe(String email, String senha) throws Exception {
        String resposta = mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoLogin(email, senha)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }

    @Test
    void deveDevolverTokenQueFuncionaNosEndpointsComOPerfilCorreto() throws Exception {
        String token = tokenDe(NUTRI, "senha-nutri-teste-123");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(NUTRI))
                .andExpect(jsonPath("$.perfil").value("NUTRICIONISTA"));
    }

    @Test
    void deveManterRbacParaTokenDaCozinha() throws Exception {
        String token = tokenDe(COZINHA, "senha-cozinha-teste-123");

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":1,"data":"2026-01-10","origem":"EXTERNA","valor":10.00}
                                """.formatted(UUID.randomUUID(), UUID.randomUUID())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveResponderOMesmo401ParaSenhaErradaEEmailInexistente() throws Exception {
        String senhaErrada = mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoLogin(NUTRI, "senha-errada-qualquer")))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String emailInexistente = mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoLogin("ninguem@seguranca.local", "senha-nutri-teste-123")))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String mensagemSenhaErrada = JsonPath.read(senhaErrada, "$.mensagem");
        String mensagemEmailInexistente = JsonPath.read(emailInexistente, "$.mensagem");
        assertThat(mensagemSenhaErrada).isEqualTo(mensagemEmailInexistente);
    }

    @Test
    void deveRetornar400ParaCorpoInvalido() throws Exception {
        mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nao-e-email\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveCriarCadaUsuarioLocalUmaVezSoMesmoRodandoDeNovo() {
        loginLocalService.garantirUsuariosLocais();

        long locais = usuarioRepository.findAll().stream()
                .map(Usuario::getEmail)
                .filter(email -> email.equals(NUTRI) || email.equals(COZINHA))
                .count();
        assertThat(locais).isEqualTo(2);
    }
}
