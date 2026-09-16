package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SaldoPorLocalDTO(
        UUID localId,
        String localNome,
        BigDecimal saldo
) {
}
