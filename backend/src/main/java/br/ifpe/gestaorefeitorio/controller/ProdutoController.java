package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService produtoService;

    // Ambos os perfis podem consultar o estoque.
    // categoria opcional filtra a listagem (US06/#80); sem parâmetro, retorna todos.
    @GetMapping
    public List<ProdutoResponseDTO> listar(@RequestParam(required = false) String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return produtoService.listarTodos();
        }
        return produtoService.listarPorCategoria(categoria);
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
    public ResponseEntity<ProdutoResponseDTO> atualizarUnidadeMedida(
            @PathVariable UUID id,
            @Valid @RequestBody ProdutoUnidadeMedidaDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.ok(produtoService.atualizarUnidadeMedida(id, request, responsavel));
    }
}
