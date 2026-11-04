package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RemetenteRequestDTO(
        @NotBlank(message = "nome é obrigatório")
        @Size(max = 150, message = "nome deve ter no máximo 150 caracteres")
        String nome,

        // Aceita com ou sem máscara (ponto, traço, barra); conta só os dígitos: 11 (CPF) ou 14 (CNPJ).
        // Vazio é tratado como ausente.
        @Size(max = 20, message = "documento deve ter no máximo 20 caracteres")
        @Pattern(regexp = "^\\s*$|^([.\\-/\\s]*\\d){11}(([.\\-/\\s]*\\d){3})?[.\\-/\\s]*$",
                message = "documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)")
        String documento,

        @Size(max = 150, message = "contato deve ter no máximo 150 caracteres")
        String contato
) {
}
