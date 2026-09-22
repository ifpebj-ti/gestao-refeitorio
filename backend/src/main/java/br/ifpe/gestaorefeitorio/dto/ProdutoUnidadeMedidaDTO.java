package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotBlank;

public record ProdutoUnidadeMedidaDTO(
        @NotBlank(message = "unidadeMedida é obrigatória")
        String unidadeMedida
) {
}
