package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record ProdutoValorReferenciaDTO(
        @DecimalMin(value = "0.01", message = "valorReferencia deve ser maior que zero")
        BigDecimal valorReferencia
) {
}
