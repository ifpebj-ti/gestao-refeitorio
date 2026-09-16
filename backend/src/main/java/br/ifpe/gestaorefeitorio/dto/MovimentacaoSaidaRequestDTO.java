package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.TipoSaida;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MovimentacaoSaidaRequestDTO(
        @NotNull(message = "produtoId é obrigatório")
        UUID produtoId,

        @NotNull(message = "localId é obrigatório")
        UUID localId,

        @NotNull(message = "quantidade é obrigatória")
        @Positive(message = "quantidade deve ser positiva")
        BigDecimal quantidade,

        @NotNull(message = "data é obrigatória")
        LocalDate data,

        @NotNull(message = "tipoSaida é obrigatório")
        TipoSaida tipoSaida
) {
}
