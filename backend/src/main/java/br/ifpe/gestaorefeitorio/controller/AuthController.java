package br.ifpe.gestaorefeitorio.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.GoogleLoginRequestDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioAutenticadoDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.service.AuthService;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponseDTO> loginComGoogle(
            @Valid @RequestBody GoogleLoginRequestDTO request,
            HttpServletResponse response) {
        AuthResponseDTO auth = authService.autenticarComGoogle(request.idToken());

        ResponseCookie cookie = ResponseCookie.from("token", auth.token())
                .httpOnly(true)
                .secure(false)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofHours(8))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(auth);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.noContent().build();
    }

    // Qualquer perfil autenticado pode consultar os próprios dados (RBAC no frontend).
    @GetMapping("/me")
    public ResponseEntity<UsuarioAutenticadoDTO> me(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(authService.usuarioAutenticado(usuario));
    }
}
