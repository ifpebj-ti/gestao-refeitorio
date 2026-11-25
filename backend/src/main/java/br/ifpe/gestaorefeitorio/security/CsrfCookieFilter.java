package br.ifpe.gestaorefeitorio.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Garante o cookie XSRF-TOKEN legível pelo front nas rotas em que a sessão começa ou é restaurada (#488).
 * Sem isso o Spring só cria o token quando alguém o pede, e o front não teria o que mandar na primeira escrita.
 * Não é um @Component, senão o Spring Boot também o registraria como filtro do servlet, fora da cadeia de segurança.
 */
class CsrfCookieFilter extends OncePerRequestFilter {

    private static final RequestMatcher LOGIN = new OrRequestMatcher(
            PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/auth/google"),
            PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/api/auth/local"));

    private static final RequestMatcher RESTAURACAO_DE_SESSAO =
            PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/auth/me");

    private final CsrfTokenRepository repositorio;

    CsrfCookieFilter(CsrfTokenRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (LOGIN.matches(request)) {
            // Token novo a cada login, para um valor plantado antes da autenticação não continuar valendo.
            repositorio.saveToken(repositorio.generateToken(request), request, response);
        } else if (RESTAURACAO_DE_SESSAO.matches(request) && autenticado()) {
            // Regrava o mesmo valor (outras abas abertas continuam válidas). Também substitui, no navegador,
            // o cookie que versões anteriores gravavam como HttpOnly e que o front não conseguia ler.
            CsrfToken atual = repositorio.loadToken(request);
            repositorio.saveToken(atual != null ? atual : repositorio.generateToken(request), request, response);
        }
        chain.doFilter(request, response);
    }

    // Resposta sem sessão não leva cookie legível: o DAST (regra 10010 do ZAP) roda sem login e barraria o deploy.
    private static boolean autenticado() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        return autenticacao != null && autenticacao.isAuthenticated()
                && !(autenticacao instanceof AnonymousAuthenticationToken);
    }
}
