package br.ifpe.gestaorefeitorio.service;

import org.junit.jupiter.api.Test;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

class EmailNormalizadoTest {

    @Test
    void deveTirarEspacosDasPontasEPassarParaMinusculas() {
        assertThat(EmailNormalizado.de("  Fulano.Silva@IFPE.edu.br ")).isEqualTo("fulano.silva@ifpe.edu.br");
    }

    @Test
    void deveDevolverNuloQuandoEmailNulo() {
        assertThat(EmailNormalizado.de(null)).isNull();
    }

    @Test
    void naoDeveDependerDoIdiomaDaMaquina() {
        Locale anterior = Locale.getDefault();
        try {
            // Em turco, "I".toLowerCase() vira "ı" (sem ponto), o que quebraria a comparação de e-mails.
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            assertThat(EmailNormalizado.de("ISMAEL@IFPE.EDU.BR")).isEqualTo("ismael@ifpe.edu.br");
        } finally {
            Locale.setDefault(anterior);
        }
    }
}
