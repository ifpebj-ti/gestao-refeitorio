package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;
import br.ifpe.gestaorefeitorio.service.LoginLocalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Devolve o token só no corpo, sem cookie: o front usa Authorization: Bearer e não abre nova superfície de CSRF.
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class LoginLocalController {

    private final LoginLocalService loginLocalService;

    @PostMapping("/local")
    public ResponseEntity<AuthResponseDTO> loginLocal(@Valid @RequestBody LoginLocalRequestDTO request) {
        return ResponseEntity.ok(loginLocalService.autenticar(request));
    }
}
