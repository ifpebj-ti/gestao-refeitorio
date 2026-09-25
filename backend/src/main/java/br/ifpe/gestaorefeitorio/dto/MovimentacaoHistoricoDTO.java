package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoSaida;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

// Diferente de MovimentacaoResponseDTO: inclui responsável e não carrega saldoAtual
// (custaria uma query de saldo a mais por linha, sem necessidade numa listagem de histórico).
public record MovimentacaoHistoricoDTO(
        UUID id,
        TipoMovimentacao tipo,
        BigDecimal quantidade,
        LocalDate data,
        UUID localId,
        String localNome,
        OrigemMovimentacao origem,
        TipoSaida tipoSaida,
        BigDecimal valor,
        String responsavelNome,
        String responsavelEmail,
        // Preenchidos só quando a movimentação é um recebimento de produção interna (US13).
        String setorOrigem,
        String responsavelSetor
) {
}
