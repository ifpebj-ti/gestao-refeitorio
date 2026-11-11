package br.ifpe.gestaorefeitorio.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Usuários de teste do login local (#298), lidos de {@code application-seguranca.yml}.
 * A validação no construtor faz o contexto falhar ao subir se faltar senha ou e-mail.
 */
@ConfigurationProperties("seguranca.login-local")
public record LoginLocalProperties(UsuarioLocal nutricionista, UsuarioLocal cozinha) {

    private static final int TAMANHO_MINIMO_SENHA = 12;
    private static final Pattern FORMATO_EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public LoginLocalProperties {
        validar(nutricionista, "LOCAL_NUTRI_EMAIL", "LOCAL_NUTRI_SENHA");
        validar(cozinha, "LOCAL_COZINHA_EMAIL", "LOCAL_COZINHA_SENHA");
    }

    private static void validar(UsuarioLocal usuario, String variavelEmail, String variavelSenha) {
        if (usuario == null || usuario.email() == null || !FORMATO_EMAIL.matcher(usuario.email()).matches()) {
            throw new IllegalStateException("Login local: e-mail inválido; confira " + variavelEmail);
        }
        if (usuario.senha() == null || usuario.senha().length() < TAMANHO_MINIMO_SENHA) {
            throw new IllegalStateException("Login local: defina " + variavelSenha + " com pelo menos "
                    + TAMANHO_MINIMO_SENHA + " caracteres");
        }
    }

    public record UsuarioLocal(String email, String nome, String senha) {

        public UsuarioLocal {
            email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
        }
    }
}
