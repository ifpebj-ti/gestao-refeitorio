package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoHistoricoDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoControleValidadeDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoQuantidadeMinimaDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoValorReferenciaDTO;
import br.ifpe.gestaorefeitorio.dto.SaldoPorLocalDTO;
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

    // Saldo detalhado por local (US10/#94) — saldoTotal já vem em ProdutoResponseDTO acima.
    @GetMapping("/{id}/saldo-por-local")
    public List<SaldoPorLocalDTO> saldoPorLocal(@PathVariable UUID id) {
        return produtoService.listarSaldoPorLocal(id);
    }

    // Histórico de movimentações do produto (US11/#97), mais recente primeiro.
    @GetMapping("/{id}/movimentacoes")
    public List<MovimentacaoHistoricoDTO> historico(@PathVariable UUID id) {
        return produtoService.listarHistorico(id);
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

    // Quantidade mínima é definida manualmente pela NUTRICIONISTA (US15/#148) — base do alerta
    // de estoque baixo.
    @PatchMapping("/{id}/quantidade-minima")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<ProdutoResponseDTO> atualizarQuantidadeMinima(
            @PathVariable UUID id,
            @Valid @RequestBody ProdutoQuantidadeMinimaDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.ok(produtoService.atualizarQuantidadeMinima(id, request, responsavel));
    }

    // Atualização de valor de referência de mercado pela NUTRICIONISTA
    @PatchMapping("/{id}/valor-referencia")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<ProdutoResponseDTO> atualizarValorReferencia(
            @PathVariable UUID id,
            @Valid @RequestBody ProdutoValorReferenciaDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.ok(produtoService.atualizarValorReferencia(id, request, responsavel));
    }

    // Marca o produto como "frio" (validade controlada, alerta com destaque/prioridade
    // maior — US16/#151), definido manualmente pela NUTRICIONISTA.
    @PatchMapping("/{id}/controle-validade")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<ProdutoResponseDTO> atualizarControleValidade(
            @PathVariable UUID id,
            @Valid @RequestBody ProdutoControleValidadeDTO request,
            @AuthenticationPrincipal Usuario responsavel) {
        return ResponseEntity.ok(produtoService.atualizarControleValidade(id, request, responsavel));
    }
}
