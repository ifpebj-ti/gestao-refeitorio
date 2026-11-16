package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotaCancelamentoRequestDTO(
        @NotBlank(message = "justificativa é obrigatória para cancelar a nota")
        @Size(max = 500, message = "justificativa deve ter no máximo 500 caracteres")
        String justificativa) {
}
