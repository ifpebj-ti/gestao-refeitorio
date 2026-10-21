package br.ifpe.gestaorefeitorio.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    private final String secret = "chave-secreta-para-testes-unitarios-deve-ter-pelo-menos-32-chars";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(secret, 86400000L, 259200000L);
    }

    @Test
    void deveGerarTokenValidoParaPerfilCozinha() {
        String token = jwtService.gerarToken("cozinha@ifpe.edu.br", "COZINHA");
        assertThat(jwtService.tokenValido(token)).isTrue();
        assertThat(jwtService.extrairEmail(token)).isEqualTo("cozinha@ifpe.edu.br");
    }

    @Test
    void deveGerarTokenValidoParaPerfilNutricionista() {
        String token = jwtService.gerarToken("nutri@ifpe.edu.br", "NUTRICIONISTA");
        assertThat(jwtService.tokenValido(token)).isTrue();
        assertThat(jwtService.extrairEmail(token)).isEqualTo("nutri@ifpe.edu.br");
    }

    @Test
    void deveRecusarSegredoEmBranco() {
        assertThatThrownBy(() -> new JwtService("   ", 86400000L, 259200000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void deveRecusarSegredoComMenosDe32Bytes() {
        assertThatThrownBy(() -> new JwtService("segredo-curto", 86400000L, 259200000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("256 bits");
    }
}
