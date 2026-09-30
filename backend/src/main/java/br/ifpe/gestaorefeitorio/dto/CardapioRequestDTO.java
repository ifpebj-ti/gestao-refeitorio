package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public record CardapioRequestDTO(
        @NotBlank(message = "refeicao é obrigatória")
        String refeicao,

        @NotNull(message = "data é obrigatória")
        LocalDate data,

        @NotNull(message = "pessoasEstimadas é obrigatório")
        @Positive(message = "pessoasEstimadas deve ser positivo")
        Integer pessoasEstimadas,

        @NotEmpty(message = "itens não pode ser vazio")
        @Valid
        List<ItemCardapioRequestDTO> itens
) {
}
