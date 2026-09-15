package br.ifpe.estoquecozinha.controller;

import br.ifpe.estoquecozinha.dto.AuthResponseDTO;
import br.ifpe.estoquecozinha.dto.GoogleLoginRequestDTO;
import br.ifpe.estoquecozinha.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponseDTO> loginComGoogle(@Valid @RequestBody GoogleLoginRequestDTO request) {
        return ResponseEntity.ok(authService.autenticarComGoogle(request.idToken()));
    }
}
