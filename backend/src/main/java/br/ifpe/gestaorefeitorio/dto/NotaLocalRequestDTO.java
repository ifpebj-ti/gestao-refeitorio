package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Emissão de nota local (US33/#293): não tem número, que é gerado pelo sistema. */
public record NotaLocalRequestDTO(
        @NotNull(message = "data é obrigatória")
        @PastOrPresent(message = "data não pode estar no futuro")
        LocalDate data,

        @NotNull(message = "remetenteId é obrigatório")
        UUID remetenteId,

        // IDs repetidos são recusados no service (Bean Validation não verifica duplicidade em lista).
        @NotEmpty(message = "movimentacaoIds deve ter ao menos uma entrada")
        List<@NotNull(message = "movimentacaoIds não pode conter valor nulo") UUID> movimentacaoIds,

        @NotBlank(message = "responsavelEntrega é obrigatório")
        @Size(max = 150, message = "responsavelEntrega deve ter no máximo 150 caracteres")
        String responsavelEntrega,

        @Size(max = 500, message = "observacoes deve ter no máximo 500 caracteres")
        String observacoes
) {
}
