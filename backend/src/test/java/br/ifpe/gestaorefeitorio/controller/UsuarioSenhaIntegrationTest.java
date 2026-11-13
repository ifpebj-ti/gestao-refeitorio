package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Definição e remoção da senha local pelo ADMIN (#367), ponta a ponta com o login por e-mail e senha.
 * Cada teste usa e-mails próprios porque o bloqueio de tentativas vive no contexto Spring compartilhado.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class UsuarioSenhaIntegrationTest {

    private static final String SENHA = "senha-definida-123";

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

    private Usuario criarUsuario(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil.name().toLowerCase() + "-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }

    private String tokenPara(Perfil perfil) {
        Usuario usuario = criarUsuario(perfil);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private ResultActions definirSenha(String token, UUID id, String senha) throws Exception {
        return mockMvc.perform(put("/api/usuarios/{id}/senha", id)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"senha":"%s"}
                        """.formatted(senha)));
    }

    private ResultActions login(String email, String senha) throws Exception {
        return mockMvc.perform(post("/api/auth/local")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","senha":"%s"}
                        """.formatted(email, senha)));
    }

    private ResultActions buscar(String token, UUID id) throws Exception {
        return mockMvc.perform(get("/api/usuarios/{id}", id).header("Authorization", "Bearer " + token));
    }

    @Test
    void deveDefinirSenhaEPermitirLoginComEla() throws Exception {
        String admin = tokenPara(Perfil.ADMIN);
        Usuario nutricionista = criarUsuario(Perfil.NUTRICIONISTA);

        definirSenha(admin, nutricionista.getId(), SENHA).andExpect(status().isNoContent());

        login(nutricionista.getEmail(), SENHA)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("NUTRICIONISTA"));
        buscar(admin, nutricionista.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.possuiSenhaLocal").value(true))
                .andExpect(content().string(not(containsString("senhaHash"))));
    }

    @Test
    void deveRecusarSenhaCurtaOuAcimaDe72Bytes() throws Exception {
        String admin = tokenPara(Perfil.ADMIN);
        UUID id = criarUsuario(Perfil.COZINHA).getId();

        definirSenha(admin, id, "curta-123")
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("senha precisa ter pelo menos 12 caracteres")));
        definirSenha(admin, id, "á".repeat(37))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("senha não pode passar de 72 bytes")));
    }

    @Test
    void deveRetornar404ParaUsuarioInexistente() throws Exception {
        String admin = tokenPara(Perfil.ADMIN);

        definirSenha(admin, UUID.randomUUID(), SENHA).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/usuarios/{id}/senha", UUID.randomUUID())
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar403ParaPerfilSemPermissaoE401SemToken() throws Exception {
        UUID id = criarUsuario(Perfil.COZINHA).getId();

        definirSenha(tokenPara(Perfil.NUTRICIONISTA), id, SENHA).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/usuarios/{id}/senha", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRemoverSenhaEImpedirOLoginLocal() throws Exception {
        String admin = tokenPara(Perfil.ADMIN);
        Usuario cozinha = criarUsuario(Perfil.COZINHA);
        definirSenha(admin, cozinha.getId(), SENHA).andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/usuarios/{id}/senha", cozinha.getId())
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isNoContent());

        login(cozinha.getEmail(), SENHA).andExpect(status().isUnauthorized());
        buscar(admin, cozinha.getId()).andExpect(jsonPath("$.possuiSenhaLocal").value(false));
    }

    @Test
    void deveLiberarOBloqueioDeTentativasAoRedefinirASenha() throws Exception {
        String admin = tokenPara(Perfil.ADMIN);
        Usuario nutricionista = criarUsuario(Perfil.NUTRICIONISTA);
        definirSenha(admin, nutricionista.getId(), SENHA).andExpect(status().isNoContent());
        for (int i = 0; i < 5; i++) {
            login(nutricionista.getEmail(), "senha-errada-123").andExpect(status().isUnauthorized());
        }
        login(nutricionista.getEmail(), SENHA).andExpect(status().isTooManyRequests());

        definirSenha(admin, nutricionista.getId(), "senha-redefinida-456").andExpect(status().isNoContent());

        login(nutricionista.getEmail(), "senha-redefinida-456").andExpect(status().isOk());
    }

    @Test
    void deveInformarPossuiSenhaLocalNaListagemSemExporOHash() throws Exception {
        String admin = tokenPara(Perfil.ADMIN);
        Usuario comSenha = criarUsuario(Perfil.NUTRICIONISTA);
        Usuario semSenha = criarUsuario(Perfil.COZINHA);
        definirSenha(admin, comSenha.getId(), SENHA).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].possuiSenhaLocal", comSenha.getId()).value(true))
                .andExpect(jsonPath("$[?(@.id == '%s')].possuiSenhaLocal", semSenha.getId()).value(false))
                .andExpect(content().string(not(containsString("senhaHash"))));
    }
}
