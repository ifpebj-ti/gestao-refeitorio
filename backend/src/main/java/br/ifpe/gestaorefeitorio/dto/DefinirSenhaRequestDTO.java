package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.nio.charset.StandardCharsets;

public record DefinirSenhaRequestDTO(
        @NotBlank(message = "senha é obrigatória")
        @Size(min = 12, message = "senha precisa ter pelo menos 12 caracteres")
        String senha) {

    private static final int TAMANHO_MAXIMO_BYTES = 72;

    // Limite do BCrypt, em bytes e não em caracteres: um caractere acentuado ocupa mais de um byte.
    @AssertTrue(message = "senha não pode passar de 72 bytes")
    public boolean isSenhaDentroDoLimite() {
        return senha == null || senha.getBytes(StandardCharsets.UTF_8).length <= TAMANHO_MAXIMO_BYTES;
    }
}
