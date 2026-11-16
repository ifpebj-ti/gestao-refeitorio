package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.model.enums.TipoNota;

import java.time.LocalDate;
import java.util.UUID;

/** Item da listagem de notas (US30/#292); o detalhe completo vem de GET /api/notas/{id}. */
public record NotaResumoDTO(
        UUID id,
        String numero,
        TipoNota tipo,
        LocalDate data,
        String remetenteNome,
        String responsavelEntrega,
        StatusNota status,
        long quantidadeEntradas,
        boolean possuiDocumento
) {
}
