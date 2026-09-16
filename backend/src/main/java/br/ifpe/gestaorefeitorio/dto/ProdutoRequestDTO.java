package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ProdutoRequestDTO(
        @NotBlank(message = "nome é obrigatório")
        String nome,

        @NotBlank(message = "categoria é obrigatória")
        String categoria,

        @NotBlank(message = "unidadeMedida é obrigatória")
        String unidadeMedida,

        @Positive(message = "valorReferencia deve ser positivo")
        BigDecimal valorReferencia
) {
}
