package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.CardapioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.CardapioResponseDTO;
import br.ifpe.gestaorefeitorio.service.CardapioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cardapios")
@RequiredArgsConstructor
public class CardapioController {

    private final CardapioService cardapioService;

    // Só a NUTRICIONISTA planeja o cardápio (US17/#154).
    @PostMapping
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<CardapioResponseDTO> cadastrar(@Valid @RequestBody CardapioRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cardapioService.cadastrar(request));
    }

    // Qualquer perfil autenticado pode consultar (mesma regra de GET /api/produtos).
    @GetMapping
    public List<CardapioResponseDTO> listar() {
        return cardapioService.listarTodos();
    }

    @GetMapping("/{id}")
    public CardapioResponseDTO buscar(@PathVariable UUID id) {
        return cardapioService.buscarPorId(id);
    }
}
