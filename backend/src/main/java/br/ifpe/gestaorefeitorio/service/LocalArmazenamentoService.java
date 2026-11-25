package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.LocalArmazenamentoResponseDTO;

import java.util.List;

public interface LocalArmazenamentoService {

    /** Ordenado por nome. */
    List<LocalArmazenamentoResponseDTO> listar();
}
