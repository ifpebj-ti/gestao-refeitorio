package br.ifpe.gestaorefeitorio.repository;

import br.ifpe.gestaorefeitorio.dto.NotaResumoDTO;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface NotaRepositoryCustom {

    /**
     * Resumo das notas com os filtros informados, combinados com E; filtro nulo não é aplicado.
     * Ordenado pela data da nota, da mais antiga para a mais recente (US30/#292).
     */
    List<NotaResumoDTO> listarResumos(StatusNota status, UUID remetenteId, LocalDate dataInicio, LocalDate dataFim);
}
