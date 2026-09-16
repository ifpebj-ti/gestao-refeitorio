package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;

import java.util.List;
import java.util.UUID;

public interface ProdutoService {
    ProdutoResponseDTO cadastrar(ProdutoRequestDTO request);

    List<ProdutoResponseDTO> listarTodos();

    ProdutoResponseDTO buscarPorId(UUID id);

    ProdutoResponseDTO atualizarUnidadeMedida(UUID id, ProdutoUnidadeMedidaDTO request, Usuario responsavel);
}
