package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.util.UUID;

// Projeção interna do repository (não exposta direto no controller) — usada pelo
// RelatorioServiceImpl para montar o RelatorioMensalItemDTO com o saldoFinal.
public record MovimentacaoAgregadaDTO(
        UUID produtoId,
        String produtoNome,
        BigDecimal quantidadeEntradas,
        BigDecimal quantidadeSaidas,
        BigDecimal quantidadeProducaoInterna,
        BigDecimal valorEntradas
) {
}
