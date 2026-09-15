package br.ifpe.gestaorefeitorio.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.service.ProdutoService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService produtoService;

    // Ambos os perfis podem consultar o estoque.
    @GetMapping
    public List<Produto> listar() {
        return produtoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Produto buscar(@PathVariable UUID id) {
        return produtoService.buscarPorId(id);
    }

    // Apenas a nutricionista (admin) pode cadastrar produtos.
    @PostMapping
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<Produto> criar(@RequestBody Produto produto) {
        return ResponseEntity.ok(produtoService.criar(produto));
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
