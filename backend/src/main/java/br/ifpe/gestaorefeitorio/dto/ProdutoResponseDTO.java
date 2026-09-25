package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProdutoResponseDTO(
        UUID id,
        String nome,
        String categoria,
        String unidadeMedida,
        BigDecimal valorReferencia,
        BigDecimal quantidadeMinima,
        BigDecimal saldoTotal
) {
}
