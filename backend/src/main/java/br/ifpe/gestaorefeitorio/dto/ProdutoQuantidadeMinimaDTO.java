package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ProdutoQuantidadeMinimaDTO(
        @NotNull(message = "quantidadeMinima é obrigatória")
        @PositiveOrZero(message = "quantidadeMinima não pode ser negativa")
        BigDecimal quantidadeMinima
) {
}
