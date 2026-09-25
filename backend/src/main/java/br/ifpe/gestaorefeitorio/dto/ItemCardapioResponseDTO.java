package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.util.UUID;

// projecaoConsumo = quantidadePorPessoa * pessoasEstimadas do cardápio — calculada em
// tempo de leitura, nunca persistida (CLAUDE.md seção 4).
public record ItemCardapioResponseDTO(
        UUID id,
        UUID produtoId,
        String produtoNome,
        BigDecimal quantidadePorPessoa,
        BigDecimal projecaoConsumo
) {
}
