package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.model.Produto;

import java.util.List;
import java.util.UUID;

public interface ProdutoService {
    ProdutoResponseDTO cadastrar(ProdutoRequestDTO request);

    List<ProdutoResponseDTO> listarTodos();

    ProdutoResponseDTO buscarPorId(UUID id);

    // Legado (US05/#22 vai revisar pra usar DTO em vez da entidade).
    Produto atualizarUnidadeMedida(UUID id, String novaUnidade);
}
