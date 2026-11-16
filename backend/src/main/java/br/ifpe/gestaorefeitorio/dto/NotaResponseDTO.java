package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.StatusNota;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record NotaResponseDTO(
        UUID id,
        String numero,
        LocalDate data,
        StatusNota status,
        RemetenteResumo remetente,
        List<NotaEntradaDTO> entradas,
        RegistradoPor registradoPor,
        String observacoes,
        // Só informa se há documento anexado (#290); o arquivo vem de GET /api/notas/{id}/documento.
        boolean possuiDocumento,
        Instant criadoEm
) {
    // Só o necessário para exibir a nota; o documento do remetente (CPF/CNPJ) fica fora.
    public record RemetenteResumo(UUID id, String nome) {
    }

    public record RegistradoPor(UUID id, String nome, String email) {
    }
}
