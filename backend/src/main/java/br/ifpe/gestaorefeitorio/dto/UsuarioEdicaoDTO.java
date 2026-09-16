package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UsuarioEdicaoDTO(
        @NotBlank(message = "nome é obrigatório")
        String nome,

        @NotNull(message = "perfil é obrigatório")
        Perfil perfil
) {
}
