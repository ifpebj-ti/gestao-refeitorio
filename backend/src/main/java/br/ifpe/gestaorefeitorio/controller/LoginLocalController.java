package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;
import br.ifpe.gestaorefeitorio.security.CookieAutenticacao;
import br.ifpe.gestaorefeitorio.service.LoginLocalService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Grava o mesmo cookie HttpOnly do login Google (#488), para a sessão sobreviver ao fechar e reabrir a aba.
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class LoginLocalController {

    private final LoginLocalService loginLocalService;
    private final CookieAutenticacao cookieAutenticacao;

    @PostMapping("/local")
    public ResponseEntity<AuthResponseDTO> loginLocal(@Valid @RequestBody LoginLocalRequestDTO request,
                                                      HttpServletResponse response) {
        AuthResponseDTO auth = loginLocalService.autenticar(request);
        cookieAutenticacao.gravar(response, auth.token());
        return ResponseEntity.ok(auth);
    }
}
