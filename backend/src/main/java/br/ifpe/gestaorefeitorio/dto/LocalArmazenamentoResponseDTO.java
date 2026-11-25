package br.ifpe.gestaorefeitorio.dto;

import java.util.UUID;

public record LocalArmazenamentoResponseDTO(
        UUID id,
        String nome
) {
}
