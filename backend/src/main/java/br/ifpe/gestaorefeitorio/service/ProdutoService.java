package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoHistoricoDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoControleValidadeDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoQuantidadeMinimaDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.dto.SaldoPorLocalDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;

import java.util.List;
import java.util.UUID;

public interface ProdutoService {
    ProdutoResponseDTO cadastrar(ProdutoRequestDTO request);

    List<ProdutoResponseDTO> listarTodos();

    List<ProdutoResponseDTO> listarPorCategoria(String categoria);

    ProdutoResponseDTO buscarPorId(UUID id);

    ProdutoResponseDTO atualizarUnidadeMedida(UUID id, ProdutoUnidadeMedidaDTO request, Usuario responsavel);

    ProdutoResponseDTO atualizarQuantidadeMinima(UUID id, ProdutoQuantidadeMinimaDTO request, Usuario responsavel);

    ProdutoResponseDTO atualizarControleValidade(UUID id, ProdutoControleValidadeDTO request, Usuario responsavel);

    List<SaldoPorLocalDTO> listarSaldoPorLocal(UUID produtoId);

    List<MovimentacaoHistoricoDTO> listarHistorico(UUID produtoId);
}
