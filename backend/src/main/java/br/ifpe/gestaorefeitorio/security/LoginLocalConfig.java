package br.ifpe.gestaorefeitorio.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

// Exceção consciente à regra "login só via Google" (US01): existe só no profile local seguranca (#298).
@Configuration
@Profile("seguranca")
@EnableConfigurationProperties(LoginLocalProperties.class)
public class LoginLocalConfig {

    public LoginLocalConfig(Environment environment) {
        if (environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException("O profile seguranca não pode ser usado junto com prod");
        }
    }
}
