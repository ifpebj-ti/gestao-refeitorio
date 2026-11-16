package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.repository.NotaRepository;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Anexo e download do documento da nota (US28/#290), ponta a ponta com Flyway (V26) e RBAC.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class NotaDocumentoIntegrationTest {

    private static final byte[] PDF = "%PDF-1.7\nconteudo da nota".getBytes(StandardCharsets.US_ASCII);

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RemetenteRepository remetenteRepository;

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private JwtService jwtService;

    private Usuario nutricionista;
    private String tokenNutricionista;

    @BeforeEach
    void setUp() {
        nutricionista = criarUsuario(Perfil.NUTRICIONISTA);
        tokenNutricionista = tokenPara(nutricionista);
    }

    private Usuario criarUsuario(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil.name().toLowerCase() + "-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }

    private String tokenPara(Usuario usuario) {
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private Nota criarNota(StatusNota status) {
        Remetente remetente = new Remetente();
        remetente.setNome("Cooperativa " + UUID.randomUUID());
        remetente = remetenteRepository.save(remetente);

        Nota nota = new Nota();
        nota.setNumero("NF-" + UUID.randomUUID().toString().substring(0, 8));
        nota.setData(LocalDate.now());
        nota.setRemetente(remetente);
        nota.setRegistradoPor(nutricionista);
        nota.setStatus(status);
        return notaRepository.save(nota);
    }

    private ResultActions anexar(String token, UUID notaId, String contentType, byte[] conteudo) throws Exception {
        return mockMvc.perform(multipart("/api/notas/{id}/documento", notaId)
                .file(new MockMultipartFile("arquivo", "nota.pdf", contentType, conteudo))
                .header("Authorization", "Bearer " + token));
    }

    @Test
    void deveAnexarEBaixarODocumentoDaNota() throws Exception {
        Nota nota = criarNota(StatusNota.PENDENTE);

        anexar(tokenNutricionista, nota.getId(), "application/pdf", PDF)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.notaId").value(nota.getId().toString()))
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.tamanhoBytes").value(PDF.length))
                .andExpect(jsonPath("$.criadoEm").exists());

        mockMvc.perform(get("/api/notas/{id}/documento", nota.getId())
                        .header("Authorization", "Bearer " + tokenNutricionista))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(content().bytes(PDF));
    }

    @Test
    void deveRetornar404QuandoANotaNaoTemDocumentoOuNaoExiste() throws Exception {
        Nota nota = criarNota(StatusNota.PENDENTE);

        mockMvc.perform(get("/api/notas/{id}/documento", nota.getId())
                        .header("Authorization", "Bearer " + tokenNutricionista))
                .andExpect(status().isNotFound());
        anexar(tokenNutricionista, UUID.randomUUID(), "application/pdf", PDF)
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar400ParaTipoNaoPermitidoOuConteudoDivergente() throws Exception {
        Nota nota = criarNota(StatusNota.PENDENTE);

        anexar(tokenNutricionista, nota.getId(), "text/plain", "texto".getBytes())
                .andExpect(status().isBadRequest());
        anexar(tokenNutricionista, nota.getId(), "application/pdf", "não é pdf".getBytes())
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar409ParaNotaValidada() throws Exception {
        Nota nota = criarNota(StatusNota.VALIDADA);

        anexar(tokenNutricionista, nota.getId(), "application/pdf", PDF)
                .andExpect(status().isConflict());
    }

    @Test
    void deveRestringirODocumentoANutricionista() throws Exception {
        Nota nota = criarNota(StatusNota.PENDENTE);
        String tokenCozinha = tokenPara(criarUsuario(Perfil.COZINHA));

        anexar(tokenCozinha, nota.getId(), "application/pdf", PDF).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/notas/{id}/documento", nota.getId())
                        .header("Authorization", "Bearer " + tokenCozinha))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/notas/{id}/documento", nota.getId()))
                .andExpect(status().isUnauthorized());
    }
}
