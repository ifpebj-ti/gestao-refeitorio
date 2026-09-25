package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.CardapioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.CardapioResponseDTO;

import java.util.List;
import java.util.UUID;

public interface CardapioService {
    CardapioResponseDTO cadastrar(CardapioRequestDTO request);

    List<CardapioResponseDTO> listarTodos();

    CardapioResponseDTO buscarPorId(UUID id);
}
