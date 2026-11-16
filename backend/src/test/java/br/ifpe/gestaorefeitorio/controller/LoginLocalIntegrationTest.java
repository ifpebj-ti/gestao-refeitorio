package br.ifpe.gestaorefeitorio.controller;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Login com usuário e senha (#365), ponta a ponta e sem profile: o token emitido vale nos endpoints reais,
 * o RBAC continua valendo, falhas de credencial dão o mesmo 401 e tentativas repetidas dão 429.
 * Cada teste usa um e-mail próprio porque o bloqueio de tentativas vive no contexto Spring compartilhado.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class LoginLocalIntegrationTest {

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

    private String emailUnico() {
        return "local-" + UUID.randomUUID() + "@ifpe.edu.br";
    }

    private Usuario criarUsuario(String email, Perfil perfil, String senha, boolean ativo) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário Local");
        usuario.setEmail(email);
        usuario.setPerfil(perfil);
        usuario.setAtivo(ativo);
        usuario.setSenhaHash(senha == null ? null : passwordEncoder.encode(senha));
        return usuarioRepository.save(usuario);
    }

    private ResultActions login(String email, String senha) throws Exception {
        return mockMvc.perform(post("/api/auth/local")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","senha":"%s"}
                        """.formatted(email, senha)));
    }

    private String tokenDe(String email, String senha) throws Exception {
        String resposta = login(email, senha)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(resposta, "$.token");
    }

    private String mensagemDe(ResultActions resultado) throws Exception {
        return JsonPath.read(resultado.andReturn().getResponse().getContentAsString(), "$.mensagem");
    }

    @Test
    void deveDevolverTokenQueFuncionaNosEndpointsERegistrarPrimeiroAcesso() throws Exception {
        String email = emailUnico();
        criarUsuario(email, Perfil.NUTRICIONISTA, SENHA, true);

        login(email, SENHA)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.perfil").value("NUTRICIONISTA"))
                .andExpect(content().string(not(containsString("senha"))));
        String token = tokenDe(email, SENHA);

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(content().string(not(containsString("senha"))));
        assertThat(usuarioRepository.findByEmail(email)).get()
                .extracting(Usuario::getPrimeiroAcessoEm).isNotNull();
    }

    @Test
    void deveAceitarEmailComMaiusculas() throws Exception {
        String email = emailUnico();
        criarUsuario(email, Perfil.NUTRICIONISTA, SENHA, true);

        login(email.toUpperCase(), SENHA).andExpect(status().isOk());
    }

    @Test
    void deveManterRbacParaTokenDaCozinha() throws Exception {
        String email = emailUnico();
        criarUsuario(email, Perfil.COZINHA, SENHA, true);
        String token = tokenDe(email, SENHA);

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":1,"data":"2026-01-10","origem":"EXTERNA","valor":10.00}
                                """.formatted(UUID.randomUUID(), UUID.randomUUID())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveResponderOMesmo401ParaOsQuatroCasosDeCredencialInvalida() throws Exception {
        String comSenha = emailUnico();
        String semSenha = emailUnico();
        String inativo = emailUnico();
        criarUsuario(comSenha, Perfil.NUTRICIONISTA, SENHA, true);
        criarUsuario(semSenha, Perfil.NUTRICIONISTA, null, true);
        criarUsuario(inativo, Perfil.NUTRICIONISTA, SENHA, false);

        List<ResultActions> respostas = List.of(
                login(emailUnico(), SENHA),
                login(comSenha, "senha-errada-123"),
                login(semSenha, SENHA),
                login(inativo, SENHA));

        Set<String> mensagens = new HashSet<>();
        for (ResultActions resposta : respostas) {
            resposta.andExpect(status().isUnauthorized());
            mensagens.add(mensagemDe(resposta));
        }
        assertThat(mensagens).containsExactly("E-mail ou senha inválidos");
    }

    @Test
    void deveBloquearCom429AposCincoErrosMesmoComASenhaCerta() throws Exception {
        String email = emailUnico();
        criarUsuario(email, Perfil.NUTRICIONISTA, SENHA, true);

        for (int i = 0; i < 5; i++) {
            login(email, "senha-errada-123").andExpect(status().isUnauthorized());
        }

        login(email, SENHA)
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.mensagem").value("Muitas tentativas de login. Tente novamente em alguns minutos."));
    }

    @Test
    void deveBloquearEmailInexistenteDoMesmoJeito() throws Exception {
        String email = emailUnico();

        for (int i = 0; i < 5; i++) {
            login(email, SENHA).andExpect(status().isUnauthorized());
        }

        login(email, SENHA).andExpect(status().isTooManyRequests());
    }

    @Test
    void deveZerarAsFalhasAposLoginComSucesso() throws Exception {
        String email = emailUnico();
        criarUsuario(email, Perfil.NUTRICIONISTA, SENHA, true);

        for (int i = 0; i < 4; i++) {
            login(email, "senha-errada-123").andExpect(status().isUnauthorized());
        }
        login(email, SENHA).andExpect(status().isOk());
        for (int i = 0; i < 4; i++) {
            login(email, "senha-errada-123").andExpect(status().isUnauthorized());
        }

        login(email, SENHA).andExpect(status().isOk());
    }

    @Test
    void deveRetornar400ParaCorpoInvalido() throws Exception {
        mockMvc.perform(post("/api/auth/local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nao-e-email\"}"))
                .andExpect(status().isBadRequest());
    }
}
