package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do cadastro de produto (US04/#74),
 * cobrindo os critérios de aceite da #75.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class ProdutoControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    private String tokenPara(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil + "-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuario = usuarioRepository.save(usuario);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    @Test
    void deveRetornar201AoCadastrarProdutoValidoEApareceNaListagem() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":"kg","valorReferencia":8.90}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Arroz"))
                .andExpect(jsonPath("$.unidadeMedida").value("kg"));

        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nome == 'Arroz')]").exists());
    }

    @Test
    void deveRetornar400SemUnidadeMedida() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400SemNomeOuCategoria() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"","categoria":"","unidadeMedida":"kg"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400ComValorReferenciaNegativo() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":"kg","valorReferencia":-5}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar404AoBuscarIdInexistente() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);

        mockMvc.perform(get("/api/produtos/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveAutorizarConsultaParaQualquerPerfilAutenticado() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void deveRetornar403QuandoPerfilNaoNutricionistaTentaCadastrar() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(post("/api/produtos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Arroz","categoria":"Secos","unidadeMedida":"kg"}
                                """))
                .andExpect(status().isForbidden());
    }
}
