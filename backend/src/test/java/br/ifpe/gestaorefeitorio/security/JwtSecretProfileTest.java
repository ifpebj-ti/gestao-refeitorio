package br.ifpe.gestaorefeitorio.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Sobe só o {@link JwtService} com o application.yml e o application-prod.yml reais, sem banco
 * nem Docker, pra verificar o fail-fast do JWT_SECRET no profile prod (#229).
 */
class JwtSecretProfileTest {

    private static final String SEGREDO_FORTE = "segredo-forte-de-teste-com-mais-de-32-bytes-para-hs256";

    // PropertyPlaceholderAutoConfiguration deixa a resolução de placeholder estrita, como na aplicação real.
    @Configuration
    @Import({PropertyPlaceholderAutoConfiguration.class, JwtService.class})
    static class ConfiguracaoMinima {
    }

    @Test
    void naoDeveSubirNoProfileProdSemJwtSecret() {
        assertThatThrownBy(() -> iniciar(Map.of(), "prod").close())
                .rootCause()
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Could not resolve placeholder 'JWT_SECRET'");
    }

    @Test
    void naoDeveSubirNoProfileProdComJwtSecretVazio() {
        assertThatThrownBy(() -> iniciar(Map.of("JWT_SECRET", ""), "prod").close())
                .rootCause()
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void deveSubirNoProfileProdComJwtSecretForte() {
        try (ConfigurableApplicationContext contexto = iniciar(Map.of("JWT_SECRET", SEGREDO_FORTE), "prod")) {
            JwtService jwtService = contexto.getBean(JwtService.class);
            String token = jwtService.gerarToken("nutri@ifpe.edu.br", "NUTRICIONISTA");
            assertThat(jwtService.tokenValido(token)).isTrue();
        }
    }

    @Test
    void deveSubirSemProfileProdUsandoSegredoPadraoDeDesenvolvimento() {
        try (ConfigurableApplicationContext contexto = iniciar(Map.of())) {
            assertThat(contexto.getBean(JwtService.class)).isNotNull();
        }
    }

    private ConfigurableApplicationContext iniciar(Map<String, Object> propriedades, String... profiles) {
        StandardEnvironment ambiente = new StandardEnvironment();
        // Remove as variáveis da máquina/CI pra um JWT_SECRET real não mascarar o teste.
        ambiente.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        ambiente.getPropertySources().addFirst(new MapPropertySource("teste", propriedades));
        return new SpringApplicationBuilder(ConfiguracaoMinima.class)
                .web(WebApplicationType.NONE)
                .environment(ambiente)
                .profiles(profiles)
                .run();
    }
}
