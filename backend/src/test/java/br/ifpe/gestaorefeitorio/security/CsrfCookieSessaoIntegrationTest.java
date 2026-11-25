package br.ifpe.gestaorefeitorio.security;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.iterableWithSize;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sessão só pelo cookie HttpOnly "token" (#488): os logins e o GET /api/auth/me emitem o XSRF-TOKEN legível
 * pelo front, e a escrita autenticada só pelo cookie passa com o cabeçalho X-XSRF-TOKEN igual ao cookie.
 * Sem o pós-processador csrf() do Spring Security Test, para exercitar o repositório e o handler reais.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class CsrfCookieSessaoIntegrationTest {

    private static final String SENHA = "senha-correta-123";

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private GoogleTokenValidator googleTokenValidator;

    private String criarNutricionista() {
        Usuario usuario = new Usuario();
        usuario.setNome("Nutricionista Sessão");
        usuario.setEmail("sessao-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(Perfil.NUTRICIONISTA);
        usuario.setAtivo(true);
        usuario.setSenhaHash(passwordEncoder.encode(SENHA));
        return usuarioRepository.save(usuario).getEmail();
    }

    private MockHttpServletResponse loginLocal(String email, Cookie... cookies) throws Exception {
        var requisicao = post("/api/auth/local")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","senha":"%s"}
                        """.formatted(email, SENHA));
        if (cookies.length > 0) {
            requisicao.cookie(cookies);
        }
        return mockMvc.perform(requisicao)
                .andExpect(status().isOk())
                .andReturn().getResponse();
    }

    private String urlProdutoInexistente() {
        return "/api/produtos/" + UUID.randomUUID();
    }

    @Test
    void loginLocalDeveGravarCookieDeSessaoHttpOnlyEXsrfTokenLegivel() throws Exception {
        String email = criarNutricionista();

        mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","senha":"%s"}
                                """.formatted(email, SENHA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(cookie().httpOnly("token", true))
                .andExpect(cookie().sameSite("token", "Lax"))
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false))
                .andExpect(cookie().sameSite("XSRF-TOKEN", "Lax"))
                .andExpect(cookie().path("XSRF-TOKEN", "/"));
    }

    @Test
    void loginGoogleDeveGravarCookieDeSessaoHttpOnlyEXsrfTokenLegivel() throws Exception {
        String email = criarNutricionista();
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail(email);
        when(googleTokenValidator.validar("token-valido")).thenReturn(payload);

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idToken":"token-valido"}
                                """))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("token", true))
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false))
                .andExpect(cookie().sameSite("XSRF-TOKEN", "Lax"));
    }

    @Test
    void loginDeveGerarXsrfTokenNovoEmVezDeReaproveitarOValorRecebido() throws Exception {
        String email = criarNutricionista();

        MockHttpServletResponse resposta = loginLocal(email, new Cookie("XSRF-TOKEN", "valor-plantado"));

        assertThat(resposta.getCookie("XSRF-TOKEN")).isNotNull();
        assertThat(resposta.getCookie("XSRF-TOKEN").getValue()).isNotBlank().isNotEqualTo("valor-plantado");
    }

    @Test
    void meDeveFuncionarSoComOCookieERegravarOMesmoXsrfTokenSemHttpOnly() throws Exception {
        MockHttpServletResponse login = loginLocal(criarNutricionista());
        Cookie sessao = login.getCookie("token");
        String xsrf = login.getCookie("XSRF-TOKEN").getValue();

        // O cookie que chega pode ter sido gravado como HttpOnly por uma versão anterior: o /me o regrava legível.
        mockMvc.perform(get("/api/auth/me").cookie(sessao, new Cookie("XSRF-TOKEN", xsrf)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("NUTRICIONISTA"))
                .andExpect(cookie().value("XSRF-TOKEN", xsrf))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false))
                .andExpect(header().stringValues("Set-Cookie", iterableWithSize(1)));
    }

    @Test
    void requisicoesAutenticadasNaoDevemApagarOXsrfTokenEntreOLoginEAEscrita() throws Exception {
        MockHttpServletResponse login = loginLocal(criarNutricionista());
        Cookie sessao = login.getCookie("token");
        Cookie xsrf = login.getCookie("XSRF-TOKEN");

        // Leituras no meio do caminho (pelo cookie ou por Bearer) não podem trocar nem apagar o XSRF-TOKEN.
        mockMvc.perform(get("/api/produtos").cookie(sessao, xsrf))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Set-Cookie"));
        mockMvc.perform(get("/api/produtos").cookie(xsrf).header("Authorization", "Bearer " + sessao.getValue()))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Set-Cookie"));

        mockMvc.perform(delete(urlProdutoInexistente())
                        .cookie(sessao, xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue()))
                .andExpect(status().isNotFound())
                .andExpect(header().doesNotExist("Set-Cookie"));
    }

    @Test
    void meDeveEmitirXsrfTokenQuandoONavegadorAindaNaoTemNenhum() throws Exception {
        Cookie sessao = loginLocal(criarNutricionista()).getCookie("token");

        mockMvc.perform(get("/api/auth/me").cookie(sessao))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false));
    }

    @Test
    void meSemAutenticacaoDeveRetornar401SemEmitirXsrfToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(cookie().doesNotExist("XSRF-TOKEN"));

        mockMvc.perform(get("/api/auth/me").cookie(new Cookie("token", "token-invalido")))
                .andExpect(status().isUnauthorized())
                .andExpect(cookie().doesNotExist("XSRF-TOKEN"));
    }

    @Test
    void rotasPublicasNaoDevemEmitirXsrfToken() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(cookie().doesNotExist("XSRF-TOKEN"));
    }

    @Test
    void deveAceitarEscritaSoPeloCookieQuandoCabecalhoXsrfIgualAoCookie() throws Exception {
        MockHttpServletResponse login = loginLocal(criarNutricionista());
        Cookie xsrf = login.getCookie("XSRF-TOKEN");

        // 404 = passou pelo CSRF e pela autenticação e chegou ao service.
        mockMvc.perform(delete(urlProdutoInexistente())
                        .cookie(login.getCookie("token"), xsrf)
                        .header("X-XSRF-TOKEN", xsrf.getValue()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar403QuandoEscritaSoPeloCookieSemCabecalhoXsrf() throws Exception {
        MockHttpServletResponse login = loginLocal(criarNutricionista());

        mockMvc.perform(delete(urlProdutoInexistente())
                        .cookie(login.getCookie("token"), login.getCookie("XSRF-TOKEN")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").value("Requisição bloqueada pela proteção CSRF"));
    }

    @Test
    void deveRetornar403QuandoCabecalhoXsrfDiferenteDoCookie() throws Exception {
        MockHttpServletResponse login = loginLocal(criarNutricionista());

        mockMvc.perform(delete(urlProdutoInexistente())
                        .cookie(login.getCookie("token"), login.getCookie("XSRF-TOKEN"))
                        .header("X-XSRF-TOKEN", "valor-de-outro-site"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar403QuandoCabecalhoXsrfEnviadoSemOCookieCorrespondente() throws Exception {
        MockHttpServletResponse login = loginLocal(criarNutricionista());
        String xsrf = login.getCookie("XSRF-TOKEN").getValue();

        mockMvc.perform(delete(urlProdutoInexistente())
                        .cookie(login.getCookie("token"))
                        .header("X-XSRF-TOKEN", xsrf))
                .andExpect(status().isForbidden());
    }
}
