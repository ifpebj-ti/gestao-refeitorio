package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.VersaoResponseDTO;
import br.ifpe.gestaorefeitorio.service.VersaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/versao")
@RequiredArgsConstructor
public class VersaoController {

    private final VersaoService versaoService;

    // Qualquer perfil vê a versão no menu lateral; o /actuator/info não serve porque o Nginx só encaminha /api/.
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public VersaoResponseDTO versao() {
        return versaoService.versaoAtual();
    }
}
