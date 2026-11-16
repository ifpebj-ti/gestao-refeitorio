package br.ifpe.gestaorefeitorio.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VersaoServiceImplTest {

    @Test
    void deveDevolverAVersaoConfigurada() {
        assertThat(new VersaoServiceImpl("0.12.1").versaoAtual().versao()).isEqualTo("0.12.1");
    }

    @Test
    void deveDevolverDevQuandoAVersaoVemVaziaOuNula() {
        assertThat(new VersaoServiceImpl("").versaoAtual().versao()).isEqualTo("dev");
        assertThat(new VersaoServiceImpl("   ").versaoAtual().versao()).isEqualTo("dev");
        assertThat(new VersaoServiceImpl(null).versaoAtual().versao()).isEqualTo("dev");
    }
}
