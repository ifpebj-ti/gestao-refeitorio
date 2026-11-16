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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Duas decisões sobre a mesma nota ao mesmo tempo (US29/#291): só a primeira é aplicada.
 * Sem @Transactional de propósito, para cada operação comitar de verdade e o @Version ser conferido no banco.
 * Em vez de disputar threads (o que deixaria o teste instável), uma cópia lida antes da validação faz o
 * papel da segunda decisão concorrente.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class NotaConcorrenciaIntegrationTest {

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

    @Test
    void deveAplicarSoAPrimeiraDecisaoQuandoDuasChegamAoMesmoTempo() throws Exception {
        Usuario nutricionista = new Usuario();
        nutricionista.setNome("Nutricionista");
        nutricionista.setEmail("nutri-" + UUID.randomUUID() + "@ifpe.edu.br");
        nutricionista.setPerfil(Perfil.NUTRICIONISTA);
        nutricionista.setAtivo(true);
        nutricionista = usuarioRepository.save(nutricionista);

        Remetente remetente = new Remetente();
        remetente.setNome("Cooperativa " + UUID.randomUUID());
        remetente = remetenteRepository.save(remetente);

        Nota nota = new Nota();
        nota.setNumero("NF-" + UUID.randomUUID().toString().substring(0, 8));
        nota.setData(LocalDate.now());
        nota.setRemetente(remetente);
        nota.setRegistradoPor(nutricionista);
        UUID notaId = notaRepository.save(nota).getId();

        // Segunda decisão: leu a nota ainda PENDENTE, antes de a primeira ser gravada.
        Nota copiaDesatualizada = notaRepository.findById(notaId).orElseThrow();

        mockMvc.perform(patch("/api/notas/{id}/validar", notaId)
                        .header("Authorization", "Bearer "
                                + jwtService.gerarToken(nutricionista.getEmail(), Perfil.NUTRICIONISTA.name())))
                .andExpect(status().isOk());

        copiaDesatualizada.setStatus(StatusNota.CANCELADA);
        copiaDesatualizada.setJustificativaCancelamento("decisão concorrente");
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> notaRepository.save(copiaDesatualizada));

        Nota gravada = notaRepository.findById(notaId).orElseThrow();
        assertThat(gravada.getStatus()).isEqualTo(StatusNota.VALIDADA);
        assertThat(gravada.getJustificativaCancelamento()).isNull();
    }
}
