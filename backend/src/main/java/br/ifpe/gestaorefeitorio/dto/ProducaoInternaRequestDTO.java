package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ProducaoInternaRequestDTO(
        @NotNull(message = "produtoId é obrigatório")
        UUID produtoId,

        @NotNull(message = "localId é obrigatório")
        UUID localId,

        @NotNull(message = "quantidade é obrigatória")
        @Positive(message = "quantidade deve ser positiva")
        BigDecimal quantidade,

        @NotNull(message = "data é obrigatória")
        LocalDate data,

        @NotBlank(message = "setorOrigem é obrigatório")
        String setorOrigem,

        @NotBlank(message = "responsavelSetor é obrigatório")
        String responsavelSetor
) {
}
