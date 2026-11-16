package br.ifpe.gestaorefeitorio.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Configuration
@EnableMethodSecurity // habilita @PreAuthorize nos controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    private static final Set<String> METODOS_SEGUROS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    @Value("${springdoc.swagger-ui.enabled:true}")
    private boolean swaggerEnabled;

    @Value("${app.cookie-seguro:false}")
    private boolean cookieSeguro;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // O JWT também chega pelo cookie "token" (#226), então requisições autenticadas só por ele
                // precisam de token CSRF (#342). Login e logout não dependem de sessão já autenticada.
                .csrf(csrf -> csrf
                        .csrfTokenRepository(repositorioCsrf())
                        .requireCsrfProtectionMatcher(SecurityConfig::exigeProtecaoCsrf)
                        .ignoringRequestMatchers("/api/auth/google", "/api/auth/local", "/api/auth/logout"))
                .cors(Customizer.withDefaults()) // usa o bean corsConfigurationSource abaixo
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Sem isso, o Spring Security cai no Http403ForbiddenEntryPoint padrão e
                // devolve 403 tanto pra quem não está autenticado quanto pra quem tem perfil insuficiente.
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler()))
                .authorizeHttpRequests(auth -> {
                    var matcherRegistry = auth
                            .requestMatchers("/api/auth/google", "/api/auth/logout", "/actuator/health")
                            .permitAll()
                            .requestMatchers(HttpMethod.POST, "/api/auth/local")
                            .permitAll();
                    if (swaggerEnabled) {
                        matcherRegistry.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll();
                    }
                    matcherRegistry.anyRequest().authenticated();
                })
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Injetado em vez de Instant.now() direto, para o bloqueio de tentativas de login ser testável.
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    // Um formulário de outro site não consegue enviar cabeçalho customizado: com Bearer não há CSRF possível.
    private static boolean exigeProtecaoCsrf(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        boolean usaBearer = authorization != null && authorization.startsWith("Bearer ");
        return !METODOS_SEGUROS.contains(request.getMethod())
                && !usaBearer
                && JwtAuthFilter.possuiCookieDeAutenticacao(request);
    }

    // Token CSRF em cookie, e não em sessão: a API é stateless.
    private CookieCsrfTokenRepository repositorioCsrf() {
        CookieCsrfTokenRepository repositorio = new CookieCsrfTokenRepository();
        repositorio.setCookieCustomizer(cookie -> cookie.secure(cookieSeguro).sameSite("Lax"));
        return repositorio;
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"timestamp\":\"" + Instant.now() + "\",\"mensagem\":\"Autenticação necessária\"}");
        };
    }

    // Só negações em nível de filtro (hoje, só o CSRF); o 403 do @PreAuthorize sai pelo GlobalExceptionHandler.
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            String mensagem = accessDeniedException instanceof CsrfException
                    ? "Requisição bloqueada pela proteção CSRF"
                    : "Acesso negado";
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"timestamp\":\"" + Instant.now() + "\",\"mensagem\":\"" + mensagem + "\"}");
        };
    }

    // Origem vem do ambiente (APP_URL_FRONTEND) porque o front publicado chama a API direto,
    // sem proxy — com origem fixa, o navegador bloqueia todas as chamadas fora do localhost.
    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${app.url-frontend}") List<String> origensPermitidas) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origensPermitidas);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
