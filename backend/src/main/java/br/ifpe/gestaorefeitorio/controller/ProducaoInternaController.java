package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.ProducaoInternaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProducaoInternaResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.service.ProducaoInternaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/producoes-internas")
@RequiredArgsConstructor
public class ProducaoInternaController {

    private final ProducaoInternaService producaoInternaService;

    // Mesmo RBAC de POST /api/movimentacoes/entrada (CLAUDE.md seção 13.2): COZINHA e
    // NUTRICIONISTA registram movimentações de estoque, ADMIN não opera estoque.
    @PostMapping
    @PreAuthorize("hasAnyRole('COZINHA', 'NUTRICIONISTA')")
    public ResponseEntity<ProducaoInternaResponseDTO> registrarRecebimento(
            @Valid @RequestBody ProducaoInternaRequestDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(producaoInternaService.registrarRecebimento(request, responsavel));
    }
}
