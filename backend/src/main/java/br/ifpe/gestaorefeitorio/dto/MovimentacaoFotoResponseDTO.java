package br.ifpe.gestaorefeitorio.dto;

import java.time.Instant;
import java.util.UUID;

public record MovimentacaoFotoResponseDTO(
        UUID movimentacaoId,
        String contentType,
        Long tamanhoBytes,
        Instant criadoEm
) {
}
