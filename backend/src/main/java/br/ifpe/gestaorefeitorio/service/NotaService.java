package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaCancelamentoRequestDTO;
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
     * Corrige uma nota PENDENTE com as mesmas regras do registro. A lista de entradas substitui os
     * vínculos atuais; {@code registradoPor} e {@code criadoEm} não mudam.
     */
    NotaResponseDTO editar(UUID id, NotaRequestDTO request, Usuario editadoPor);

    /**
     * PENDENTE → VALIDADA, registrando quem validou e quando (US29/#291).
     *
     * @throws br.ifpe.gestaorefeitorio.exception.NotaNaoPendenteException nota já validada ou cancelada (409).
     */
    NotaResponseDTO validar(UUID id, Usuario decidiuPor);

    /**
     * PENDENTE → CANCELADA com justificativa, registrando quem cancelou e quando. As entradas vinculadas
     * não são estornadas nem desvinculadas (US29/#291).
     *
     * @throws br.ifpe.gestaorefeitorio.exception.NotaNaoPendenteException nota já validada ou cancelada (409).
     */
    NotaResponseDTO cancelar(UUID id, NotaCancelamentoRequestDTO request, Usuario decidiuPor);

    /**
     * Entradas ainda sem nota, da mais recente para a mais antiga. Filtros nulos não são aplicados;
     * {@code fornecedor} é busca parcial sem diferenciar maiúsculas/minúsculas.
     */
    List<NotaEntradaDTO> listarEntradasDisponiveis(LocalDate dataInicio, LocalDate dataFim, UUID produtoId,
                                                   String fornecedor);
}
