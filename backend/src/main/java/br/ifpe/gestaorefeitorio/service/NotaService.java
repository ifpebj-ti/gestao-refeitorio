package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface NotaService {
    /**
     * Registra a nota com status PENDENTE, vinculada às entradas informadas. Cada entrada só pode
     * pertencer a uma nota, e o número só é único dentro do mesmo remetente.
     */
    NotaResponseDTO registrar(NotaRequestDTO request, Usuario registradoPor);

    /**
     * Entradas ainda sem nota, da mais recente para a mais antiga. Filtros nulos não são aplicados;
     * {@code fornecedor} é busca parcial sem diferenciar maiúsculas/minúsculas.
     */
    List<NotaEntradaDTO> listarEntradasDisponiveis(LocalDate dataInicio, LocalDate dataFim, UUID produtoId,
                                                   String fornecedor);
}
