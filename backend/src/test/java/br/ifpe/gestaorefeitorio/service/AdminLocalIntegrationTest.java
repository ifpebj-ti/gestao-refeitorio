package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sobe a aplicação inteira num banco novo com o ADMIN local e o ADMIN inicial via Google configurados (#366):
 * os dois são criados no boot, o ADMIN local entra com e-mail e senha e uma nova execução não muda a senha.
 */
@SpringBootTest(properties = {
        "admin.local.email=admin.local@ifpe.edu.br",
        "admin.local.senha=senha-do-admin-local-123",
        "admin.inicial.email=admin.google@ifpe.edu.br"
})
@AutoConfigureMockMvc
@Testcontainers
class AdminLocalIntegrationTest {

    private static final String EMAIL_LOCAL = "admin.local@ifpe.edu.br";
    private static final String SENHA_LOCAL = "senha-do-admin-local-123";

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AdminLocalService adminLocalService;

    // O ADMIN inicial via Google envia convite por e-mail; aqui não há SMTP.
    @MockitoBean
    private ConviteService conviteService;

    @Test
    void deveCriarOAdminLocalEOAdminDoGoogleNoBoot() {
        assertThat(usuarioRepository.findByPerfilAndAtivoTrue(Perfil.ADMIN))
                .extracting(Usuario::getEmail)
                .containsExactlyInAnyOrder(EMAIL_LOCAL, "admin.google@ifpe.edu.br");
        assertThat(usuarioRepository.findByEmail(EMAIL_LOCAL)).get()
                .extracting(Usuario::getSenhaHash).isNotNull();
    }

    @Test
    void deveEntrarComEmailESenhaEAcessarAGestaoDeUsuarios() throws Exception {
        String resposta = mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(EMAIL_LOCAL, SENHA_LOCAL)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(resposta, "$.token");

        mockMvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void naoDeveTrocarASenhaQuandoAInicializacaoRodaDeNovo() {
        String hashAntes = usuarioRepository.findByEmail(EMAIL_LOCAL).orElseThrow().getSenhaHash();

        adminLocalService.garantirAdminLocal();

        // O BCrypt gera um salt novo a cada hash: se a senha fosse regravada, o hash mudaria.
        assertThat(usuarioRepository.findByEmail(EMAIL_LOCAL).orElseThrow().getSenhaHash()).isEqualTo(hashAntes);
    }
}
