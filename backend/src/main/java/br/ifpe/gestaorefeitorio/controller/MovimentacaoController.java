package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.service.MovimentacaoService;
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
@RequestMapping("/api/movimentacoes")
@RequiredArgsConstructor
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;

    // CLAUDE.md seção 4: COZINHA registra entradas/saídas; NUTRICIONISTA acompanha estoque.
    // ADMIN é perfil técnico, não opera estoque.
    @PostMapping("/entrada")
    @PreAuthorize("hasAnyRole('COZINHA', 'NUTRICIONISTA')")
    public ResponseEntity<MovimentacaoResponseDTO> registrarEntrada(
            @Valid @RequestBody MovimentacaoRequestDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacaoService.registrarEntrada(request, responsavel));
    }
}
