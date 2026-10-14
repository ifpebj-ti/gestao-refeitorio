package br.ifpe.gestaorefeitorio.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private final String secret = "chave-secreta-para-testes-unitarios-deve-ter-pelo-menos-32-chars";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", secret);
        ReflectionTestUtils.setField(jwtService, "expirationMs", 86400000L);
        ReflectionTestUtils.setField(jwtService, "expirationCozinhaMs", 259200000L);
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
}
