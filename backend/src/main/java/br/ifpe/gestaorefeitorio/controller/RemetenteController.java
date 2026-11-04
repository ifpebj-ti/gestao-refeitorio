package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.RemetenteRequestDTO;
import br.ifpe.gestaorefeitorio.dto.RemetenteResponseDTO;
import br.ifpe.gestaorefeitorio.service.RemetenteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// Remetentes das notas (US26/#286): mantidos pela NUTRICIONISTA, que é quem registra as notas.
@RestController
@RequestMapping("/api/remetentes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('NUTRICIONISTA')")
public class RemetenteController {

    private final RemetenteService remetenteService;

    @PostMapping
    public ResponseEntity<RemetenteResponseDTO> cadastrar(@Valid @RequestBody RemetenteRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(remetenteService.cadastrar(request));
    }

    @GetMapping
    public List<RemetenteResponseDTO> listar(@RequestParam(required = false) Boolean ativo) {
        return remetenteService.listar(ativo);
    }

    @GetMapping("/{id}")
    public RemetenteResponseDTO buscar(@PathVariable UUID id) {
        return remetenteService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public RemetenteResponseDTO editar(@PathVariable UUID id, @Valid @RequestBody RemetenteRequestDTO request) {
        return remetenteService.editar(id, request);
    }

    @PatchMapping("/{id}/inativar")
    public RemetenteResponseDTO inativar(@PathVariable UUID id) {
        return remetenteService.inativar(id);
    }

    @PatchMapping("/{id}/reativar")
    public RemetenteResponseDTO reativar(@PathVariable UUID id) {
        return remetenteService.reativar(id);
    }
}
