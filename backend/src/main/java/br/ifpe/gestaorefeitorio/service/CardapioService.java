package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.CardapioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.CardapioResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProjecaoConsumoDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CardapioService {
    CardapioResponseDTO cadastrar(CardapioRequestDTO request);

    List<CardapioResponseDTO> listarTodos();

    CardapioResponseDTO buscarPorId(UUID id);

    List<ProjecaoConsumoDTO> projetarConsumoPorPeriodo(LocalDate dataInicio, LocalDate dataFim);
}
