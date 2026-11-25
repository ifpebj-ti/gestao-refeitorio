package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.GoogleTokenValidator;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Listagem de locais de armazenamento (#473): qualquer perfil autenticado lista os locais
 * semeados pelas migrations, com os UUIDs fixos que o frontend usa; sem token, 401.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class LocalArmazenamentoControllerIntegrationTest {

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

    @MockitoBean
    private GoogleTokenValidator googleTokenValidator;

    private String tokenPara(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil.name().toLowerCase() + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuarioRepository.save(usuario);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    @ParameterizedTest
    @EnumSource(Perfil.class)
    void deveListarOsLocaisPadraoOrdenadosPorNomeParaQualquerPerfil(Perfil perfil) throws Exception {
        mockMvc.perform(get("/api/locais-armazenamento")
                        .header("Authorization", "Bearer " + tokenPara(perfil)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value("e10aa4e1-9b74-4791-8b01-1a8efd93af8c"))
                .andExpect(jsonPath("$[0].nome").value("Congelados/Refrigerados"))
                .andExpect(jsonPath("$[1].id").value("eddeb319-7af8-4d68-bd88-8a739c968c74"))
                .andExpect(jsonPath("$[1].nome").value("Despensa"))
                .andExpect(jsonPath("$[0].criadoEm").doesNotExist());
    }

    @Test
    void deveRetornar401SemToken() throws Exception {
        mockMvc.perform(get("/api/locais-armazenamento"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornar401ComTokenInvalido() throws Exception {
        mockMvc.perform(get("/api/locais-armazenamento")
                        .header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isUnauthorized());
    }
}
