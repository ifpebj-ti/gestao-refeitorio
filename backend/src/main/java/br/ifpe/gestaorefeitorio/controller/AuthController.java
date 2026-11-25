package br.ifpe.gestaorefeitorio.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import br.ifpe.gestaorefeitorio.security.CookieAutenticacao;
import br.ifpe.gestaorefeitorio.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieAutenticacao cookieAutenticacao;

    @PostMapping("/google")
    public ResponseEntity<AuthResponseDTO> loginComGoogle(
            @Valid @RequestBody GoogleLoginRequestDTO request,
            HttpServletResponse response) {
        AuthResponseDTO auth = authService.autenticarComGoogle(request.idToken());
        cookieAutenticacao.gravar(response, auth.token());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        cookieAutenticacao.remover(response);
        return ResponseEntity.noContent().build();
    }

    // Qualquer perfil autenticado pode consultar os próprios dados (RBAC no frontend).
    @GetMapping("/me")
    public ResponseEntity<UsuarioAutenticadoDTO> me(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(authService.usuarioAutenticado(usuario));
    }
}
