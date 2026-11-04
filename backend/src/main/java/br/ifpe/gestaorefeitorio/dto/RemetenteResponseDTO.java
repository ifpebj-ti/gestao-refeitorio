package br.ifpe.gestaorefeitorio.dto;

import java.time.Instant;
import java.util.UUID;

public record RemetenteResponseDTO(
        UUID id,
        String nome,
        String documento,
        String contato,
        boolean ativo,
        Instant criadoEm
) {
}
