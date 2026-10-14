package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record ItemCardapioRequestDTO(
        @NotNull(message = "produtoId é obrigatório")
        UUID produtoId,

        @NotNull(message = "quantidadePorPessoa é obrigatória")
        @Positive(message = "quantidadePorPessoa deve ser positiva")
        BigDecimal quantidadePorPessoa
) {
}
