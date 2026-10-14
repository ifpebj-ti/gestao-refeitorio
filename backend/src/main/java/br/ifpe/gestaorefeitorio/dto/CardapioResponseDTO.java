package br.ifpe.gestaorefeitorio.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CardapioResponseDTO(
        UUID id,
        String refeicao,
        LocalDate data,
        Integer pessoasEstimadas,
        List<ItemCardapioResponseDTO> itens
) {
}
