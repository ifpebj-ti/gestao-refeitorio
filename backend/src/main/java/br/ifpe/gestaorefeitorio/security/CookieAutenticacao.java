package br.ifpe.gestaorefeitorio.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Cookie HttpOnly "token" com o JWT, gravado nos dois logins (Google e local) e apagado no logout. */
@Component
public class CookieAutenticacao {

    private final boolean cookieSeguro;

    public CookieAutenticacao(@Value("${app.cookie-seguro:false}") boolean cookieSeguro) {
        this.cookieSeguro = cookieSeguro;
    }

    public void gravar(HttpServletResponse response, String jwt) {
        adicionar(response, jwt, Duration.ofHours(8));
    }

    public void remover(HttpServletResponse response) {
        adicionar(response, "", Duration.ZERO);
    }

    private void adicionar(HttpServletResponse response, String valor, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from("token", valor)
                .httpOnly(true)
                .secure(cookieSeguro)
                .path("/")
                .sameSite("Lax")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
