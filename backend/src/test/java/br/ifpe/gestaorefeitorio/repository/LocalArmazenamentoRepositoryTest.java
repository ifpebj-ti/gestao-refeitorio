package br.ifpe.gestaorefeitorio.repository;

import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;

/**
 * Cobre os critérios de aceite da #83 (LocalArmazenamento): confirma que a
 * migration V4 seedou os locais padrão e que a unicidade de nome é respeitada.
 * Usa @DataJpaTest (sem contexto web) + Testcontainers, já que a #83 não tem
 * controller/service.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Testcontainers
class LocalArmazenamentoRepositoryTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @Test
    void deveEncontrarLocaisSeedadosPelaMigration() {
        List<String> nomes = localArmazenamentoRepository.findAll().stream()
                .map(LocalArmazenamento::getNome)
                .toList();

        assertThat(nomes).contains("Despensa", "Congelados/Refrigerados");
    }

    @Test
    void deveEncontrarPorNomeQuandoExiste() {
        Optional<LocalArmazenamento> resultado = localArmazenamentoRepository.findByNome("Despensa");

        assertThat(resultado).isPresent();
        assertThat(resultado.get().getNome()).isEqualTo("Despensa");
    }

    @Test
    void deveRetornarVazioQuandoNomeNaoExiste() {
        Optional<LocalArmazenamento> resultado = localArmazenamentoRepository.findByNome("Inexistente");

        assertThat(resultado).isEmpty();
    }

    @Test
    void deveFalharAoSalvarNomeDuplicado() {
        LocalArmazenamento duplicado = new LocalArmazenamento();
        duplicado.setNome("Despensa");

        assertThrows(DataIntegrityViolationException.class,
                () -> localArmazenamentoRepository.saveAndFlush(duplicado));
    }
}