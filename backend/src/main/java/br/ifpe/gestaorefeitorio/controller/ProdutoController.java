package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService produtoService;

    // Ambos os perfis podem consultar o estoque.
    @GetMapping
    public List<ProdutoResponseDTO> listar() {
        return produtoService.listarTodos();
    }

    @GetMapping("/{id}")
    public ProdutoResponseDTO buscar(@PathVariable UUID id) {
        return produtoService.buscarPorId(id);
    }

    // Apenas o perfil NUTRICIONISTA pode cadastrar produtos (ADMIN é perfil técnico, não gerencia catálogo).
    @PostMapping
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<ProdutoResponseDTO> criar(@Valid @RequestBody ProdutoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.cadastrar(request));
    }

    // Requisito do cliente: poder editar a unidade de medida de um produto.
    @PatchMapping("/{id}/unidade-medida")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<Produto> atualizarUnidadeMedida(
            @PathVariable UUID id,
            @RequestBody String novaUnidade) {
        return ResponseEntity.ok(produtoService.atualizarUnidadeMedida(id, novaUnidade));
    }
}
