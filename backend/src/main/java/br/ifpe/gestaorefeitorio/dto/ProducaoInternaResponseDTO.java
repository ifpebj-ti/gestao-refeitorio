package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ProducaoInternaResponseDTO(
        UUID id,
        UUID produtoId,
        String produtoNome,
        UUID localId,
        String localNome,
        BigDecimal quantidade,
        LocalDate data,
        String setorOrigem,
        String responsavelSetor,
        BigDecimal saldoAtual
) {
}
