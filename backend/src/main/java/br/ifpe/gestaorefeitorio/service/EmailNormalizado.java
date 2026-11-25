package br.ifpe.gestaorefeitorio.service;

import java.util.Locale;

/**
 * Forma única do e-mail em cadastro, login e bloqueio de tentativas (#468): sem espaços nas pontas e em
 * minúsculas. Locale.ROOT porque em alguns idiomas (turco, por exemplo) "I" não vira "i" em toLowerCase().
 */
public final class EmailNormalizado {

    private EmailNormalizado() {
    }

    /** Devolve {@code null} quando o e-mail é nulo: quem chama decide se isso é erro. */
    public static String de(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
