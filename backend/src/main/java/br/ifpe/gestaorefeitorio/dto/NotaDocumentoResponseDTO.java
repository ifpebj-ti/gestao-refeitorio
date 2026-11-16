package br.ifpe.gestaorefeitorio.dto;

import java.time.Instant;
import java.util.UUID;

public record NotaDocumentoResponseDTO(
        UUID notaId,
        String contentType,
        Long tamanhoBytes,
        Instant criadoEm
) {
}
