package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoFotoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoSaidaRequestDTO;
import br.ifpe.gestaorefeitorio.model.MovimentacaoFoto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.service.MovimentacaoFotoService;
import br.ifpe.gestaorefeitorio.service.MovimentacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/movimentacoes")
@RequiredArgsConstructor
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;
    private final MovimentacaoFotoService movimentacaoFotoService;

    // CLAUDE.md seção 4: COZINHA registra entradas/saídas; NUTRICIONISTA acompanha estoque.
    // ADMIN é perfil técnico, não opera estoque.
    @PostMapping("/entrada")
    @PreAuthorize("hasAnyRole('COZINHA', 'NUTRICIONISTA')")
    public ResponseEntity<MovimentacaoResponseDTO> registrarEntrada(
            @Valid @RequestBody MovimentacaoRequestDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacaoService.registrarEntrada(request, responsavel));
    }

    // Bloqueio de saldo negativo ainda não implementado — US12/#30, issue própria.
    @PostMapping("/saida")
    @PreAuthorize("hasAnyRole('COZINHA', 'NUTRICIONISTA')")
    public ResponseEntity<MovimentacaoResponseDTO> registrarSaida(
            @Valid @RequestBody MovimentacaoSaidaRequestDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacaoService.registrarSaida(request, responsavel));
    }

    // Anexar foto é sempre opcional (US08/#88) — não faz parte do registro da entrada.
    @PostMapping(value = "/{id}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('COZINHA', 'NUTRICIONISTA')")
    public ResponseEntity<MovimentacaoFotoResponseDTO> anexarFoto(
            @PathVariable UUID id,
            @RequestParam("arquivo") MultipartFile arquivo,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacaoFotoService.anexar(id, arquivo, responsavel));
    }

    // Qualquer perfil autenticado pode consultar (mesma regra de GET /api/produtos).
    @GetMapping("/{id}/foto")
    public ResponseEntity<byte[]> buscarFoto(@PathVariable UUID id) {
        MovimentacaoFoto foto = movimentacaoFotoService.buscarPorMovimentacao(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.getContentType()))
                .body(foto.getConteudo());
    }
}
