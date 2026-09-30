package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.util.UUID;

// Consolida vários cardápios de um período, somando por produto (US18/#157) — diferente da
// projeção por item de um único cardápio (CardapioResponseDTO/ItemCardapioResponseDTO, US17).
public record ProjecaoConsumoDTO(
        UUID produtoId,
        String produtoNome,
        BigDecimal quantidadeEstimada
) {
}
