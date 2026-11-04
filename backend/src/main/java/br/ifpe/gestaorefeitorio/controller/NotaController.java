package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.service.NotaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notas")
@RequiredArgsConstructor
public class NotaController {

    private final NotaService notaService;

    // Só a NUTRICIONISTA registra entrada (#202), então só ela registra a nota que comprova a entrada.
    @PostMapping
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<NotaResponseDTO> registrar(
            @Valid @RequestBody NotaRequestDTO request,
            @AuthenticationPrincipal Usuario registradoPor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notaService.registrar(request, registradoPor));
    }

    // Entradas ainda sem nota, para o front montar uma nota com várias entradas (#288).
    @GetMapping("/entradas-disponiveis")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public List<NotaEntradaDTO> listarEntradasDisponiveis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(required = false) String fornecedor) {
        return notaService.listarEntradasDisponiveis(dataInicio, dataFim, produtoId, fornecedor);
    }
}
