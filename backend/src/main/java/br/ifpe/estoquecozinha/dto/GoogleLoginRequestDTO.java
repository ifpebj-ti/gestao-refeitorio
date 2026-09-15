package br.ifpe.estoquecozinha.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequestDTO(
        @NotBlank(message = "idToken é obrigatório")
        String idToken
) {
}
