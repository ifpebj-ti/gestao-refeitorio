package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoSaida;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MovimentacaoResponseDTO(
        UUID id,
        UUID produtoId,
        String produtoNome,
        UUID localId,
        String localNome,
        TipoMovimentacao tipo,
        BigDecimal quantidade,
        LocalDate data,
        OrigemMovimentacao origem,
        TipoSaida tipoSaida,
        BigDecimal valor,
        BigDecimal saldoAtual
) {
}
