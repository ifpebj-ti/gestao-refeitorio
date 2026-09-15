package br.ifpe.gestaorefeitorio.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.GoogleLoginRequestDTO;
import br.ifpe.gestaorefeitorio.service.AuthService;

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
