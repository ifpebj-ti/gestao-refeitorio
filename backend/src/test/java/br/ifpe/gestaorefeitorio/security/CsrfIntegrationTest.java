package br.ifpe.gestaorefeitorio.security;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proteção CSRF (#342): exigida só quando a requisição muda estado e se autentica apenas pelo cookie "token".
 * DELETE de produto inexistente é usado como operação de escrita sem corpo: passar do CSRF e da autenticação dá 404.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class CsrfIntegrationTest {

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
        usuario.setNome("Nutricionista CSRF");
        usuario.setEmail("nutri-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(Perfil.NUTRICIONISTA);
        usuario.setAtivo(true);
        usuarioRepository.save(usuario);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private String urlProdutoInexistente() {
        return "/api/produtos/" + UUID.randomUUID();
    }

    @Test
    void deveRetornar403QuandoEscritaAutenticadaSoPeloCookieSemTokenCsrf() throws Exception {
        String token = tokenNutricionista();

        mockMvc.perform(delete(urlProdutoInexistente()).cookie(new Cookie("token", token)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").value("Requisição bloqueada pela proteção CSRF"));
    }

    @Test
    void deveAceitarEscritaPeloCookieQuandoTokenCsrfValido() throws Exception {
        String token = tokenNutricionista();

        mockMvc.perform(delete(urlProdutoInexistente()).cookie(new Cookie("token", token)).with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    void naoDeveExigirTokenCsrfQuandoAutenticadoPorBearer() throws Exception {
        String token = tokenNutricionista();

        mockMvc.perform(delete(urlProdutoInexistente())
                        .header("Authorization", "Bearer " + token)
                        .cookie(new Cookie("token", token)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveContinuarRetornando401QuandoEscritaSemCredencial() throws Exception {
        mockMvc.perform(delete(urlProdutoInexistente()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveAceitarLeituraAutenticadaSoPeloCookie() throws Exception {
        String token = tokenNutricionista();

        mockMvc.perform(get("/api/produtos").cookie(new Cookie("token", token)))
                .andExpect(status().isOk());
    }
}
