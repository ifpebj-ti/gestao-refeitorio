package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UsuarioRequestDTO(
        @NotBlank(message = "nome é obrigatório")
        String nome,

        @NotBlank(message = "email é obrigatório")
        @Email(message = "email deve ter um formato válido")
        String email,

        @NotNull(message = "perfil é obrigatório")
        Perfil perfil
) {
}
