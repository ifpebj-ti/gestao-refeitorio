package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.exception.LoginBloqueadoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TentativasLoginServiceImplTest {

    private static final String EMAIL = "nutri@ifpe.edu.br";

    private RelogioAjustavel relogio;
    private TentativasLoginServiceImpl service;

    @BeforeEach
    void setUp() {
        relogio = new RelogioAjustavel(Instant.parse("2026-11-13T12:00:00Z"));
        service = new TentativasLoginServiceImpl(relogio);
    }

    private void falhar(int vezes) {
        for (int i = 0; i < vezes; i++) {
            service.registrarFalha(EMAIL);
        }
    }

    @Test
    void deveBloquearNaQuintaFalhaSeguida() {
        falhar(4);
        assertThatCode(() -> service.verificarBloqueio(EMAIL)).doesNotThrowAnyException();

        assertThat(service.registrarFalha(EMAIL)).isTrue();

        LoginBloqueadoException ex = assertThrows(LoginBloqueadoException.class,
                () -> service.verificarBloqueio(EMAIL));
        assertThat(ex.getSegundosRestantes()).isEqualTo(Duration.ofMinutes(15).toSeconds());
    }

    @Test
    void deveLiberarDepoisDeQuinzeMinutos() {
        falhar(5);

        relogio.avancar(Duration.ofMinutes(15));

        assertThatCode(() -> service.verificarBloqueio(EMAIL)).doesNotThrowAnyException();
        assertThat(service.registrarFalha(EMAIL)).isFalse();
    }

    @Test
    void deveZerarAsFalhasQuandoLoginTemSucesso() {
        falhar(4);

        service.registrarSucesso(EMAIL);

        assertThat(service.registrarFalha(EMAIL)).isFalse();
        falhar(3);
        assertThatCode(() -> service.verificarBloqueio(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    void deveDesconsiderarFalhasForaDaJanela() {
        falhar(4);

        relogio.avancar(Duration.ofMinutes(16));

        assertThat(service.registrarFalha(EMAIL)).isFalse();
        assertThatCode(() -> service.verificarBloqueio(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    void deveContarFalhasSeparadamentePorEmail() {
        falhar(5);

        assertThatCode(() -> service.verificarBloqueio("outro@ifpe.edu.br")).doesNotThrowAnyException();
    }

    private static final class RelogioAjustavel extends Clock {

        private Instant agora;

        RelogioAjustavel(Instant agora) {
            this.agora = agora;
        }

        void avancar(Duration duracao) {
            agora = agora.plus(duracao);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return agora;
        }
    }
}
