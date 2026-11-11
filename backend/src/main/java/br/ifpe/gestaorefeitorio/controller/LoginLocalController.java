package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;
import br.ifpe.gestaorefeitorio.service.LoginLocalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Só existe no profile seguranca (#298). Devolve o token no corpo, sem cookie: os testes usam Authorization: Bearer.
@RestController
@Profile("seguranca")
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class LoginLocalController {

    private final LoginLocalService loginLocalService;

    @PostMapping("/local")
    public ResponseEntity<AuthResponseDTO> loginLocal(@Valid @RequestBody LoginLocalRequestDTO request) {
        return ResponseEntity.ok(loginLocalService.autenticar(request));
    }
}
