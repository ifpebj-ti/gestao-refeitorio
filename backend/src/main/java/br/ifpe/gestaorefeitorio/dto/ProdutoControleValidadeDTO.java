package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotNull;

public record ProdutoControleValidadeDTO(
        @NotNull(message = "controlaValidade é obrigatório")
        Boolean controlaValidade
) {
}
