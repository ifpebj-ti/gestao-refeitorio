package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record NotaEntradaDTO(
        UUID movimentacaoId,
        UUID produtoId,
        String produtoNome,
        BigDecimal quantidade,
        String unidadeMedida,
        UUID localId,
        String localNome,
        String lote,
        LocalDate dataValidade,
        LocalDate data,
        String fornecedor
) {
}
