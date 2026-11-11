package br.ifpe.gestaorefeitorio.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Travas de inicialização do profile seguranca (#298), sem banco: não sobe junto com prod
 * e não sobe sem senhas válidas.
 */
class LoginLocalConfigTest {

    private static final String[] PROPRIEDADES_VALIDAS = {
            "seguranca.login-local.nutricionista.email=nutricionista@seguranca.local",
            "seguranca.login-local.nutricionista.senha=senha-nutri-teste-123",
            "seguranca.login-local.cozinha.email=cozinha@seguranca.local",
            "seguranca.login-local.cozinha.senha=senha-cozinha-teste-123"
    };

    private ApplicationContextRunner runner(String... profiles) {
        return new ApplicationContextRunner()
                .withInitializer(contexto -> contexto.getEnvironment().setActiveProfiles(profiles))
                .withUserConfiguration(LoginLocalConfig.class);
    }

    private static Throwable causaRaiz(Throwable erro) {
        Throwable causa = erro;
        while (causa.getCause() != null) {
            causa = causa.getCause();
        }
        return causa;
    }

    @Test
    void deveSubirComConfiguracaoValida() {
        runner("seguranca")
                .withPropertyValues(PROPRIEDADES_VALIDAS)
                .run(contexto -> {
                    assertThat(contexto).hasNotFailed();
                    assertThat(contexto).hasSingleBean(LoginLocalProperties.class);
                });
    }

    @Test
    void naoDeveSubirJuntoComProd() {
        runner("seguranca", "prod")
                .withPropertyValues(PROPRIEDADES_VALIDAS)
                .run(contexto -> {
                    assertThat(contexto).hasFailed();
                    assertThat(causaRaiz(contexto.getStartupFailure())).hasMessageContaining("prod");
                });
    }

    @Test
    void naoDeveSubirSemSenhaDaNutricionista() {
        runner("seguranca")
                .withPropertyValues(
                        "seguranca.login-local.nutricionista.email=nutricionista@seguranca.local",
                        "seguranca.login-local.cozinha.email=cozinha@seguranca.local",
                        "seguranca.login-local.cozinha.senha=senha-cozinha-teste-123")
                .run(contexto -> {
                    assertThat(contexto).hasFailed();
                    assertThat(causaRaiz(contexto.getStartupFailure())).hasMessageContaining("LOCAL_NUTRI_SENHA");
                });
    }

    @Test
    void naoDeveSubirComSenhaCurta() {
        runner("seguranca")
                .withPropertyValues(
                        "seguranca.login-local.nutricionista.email=nutricionista@seguranca.local",
                        "seguranca.login-local.nutricionista.senha=senha-nutri-teste-123",
                        "seguranca.login-local.cozinha.email=cozinha@seguranca.local",
                        "seguranca.login-local.cozinha.senha=curta")
                .run(contexto -> {
                    assertThat(contexto).hasFailed();
                    assertThat(causaRaiz(contexto.getStartupFailure())).hasMessageContaining("LOCAL_COZINHA_SENHA");
                });
    }

    @Test
    void naoDeveCarregarNadaSemOProfile() {
        runner()
                .withPropertyValues(PROPRIEDADES_VALIDAS)
                .run(contexto -> {
                    assertThat(contexto).hasNotFailed();
                    assertThat(contexto).doesNotHaveBean(LoginLocalProperties.class);
                });
    }
}
