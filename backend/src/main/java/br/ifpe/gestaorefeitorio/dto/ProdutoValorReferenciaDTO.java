package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProdutoValorReferenciaDTO(
        @NotNull(message = "valorReferencia é obrigatório")
        @DecimalMin(value = "0.01", message = "valorReferencia deve ser maior que zero")
        BigDecimal valorReferencia
) {
}
