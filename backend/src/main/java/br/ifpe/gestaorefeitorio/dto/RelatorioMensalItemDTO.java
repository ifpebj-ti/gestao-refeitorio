package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RelatorioMensalItemDTO(
        UUID produtoId,
        String produtoNome,
        BigDecimal quantidadeEntradas,
        BigDecimal quantidadeSaidas,
        BigDecimal quantidadeProducaoInterna,
        BigDecimal valorEntradas,
        // Saldo acumulado do produto até o fim do período (estoque real naquele momento),
        // não a diferença entre entradas e saídas só do período.
        BigDecimal saldoFinal
) {
}
