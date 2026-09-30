package br.ifpe.gestaorefeitorio.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

// Um ponto do gráfico de consumo (US21/#166): quantidade total consumida (tipoSaida =
// CONSUMO) numa data, somada entre todos os produtos ou de um produto específico.
public record ConsumoDiarioDTO(
        LocalDate data,
        BigDecimal quantidade
) {
}
