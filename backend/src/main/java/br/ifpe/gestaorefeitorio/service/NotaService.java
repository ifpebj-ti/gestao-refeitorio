package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaCancelamentoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaLocalRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResumoDTO;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.model.enums.TipoNota;
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
     * Emite uma nota LOCAL (US33/#293), PENDENTE, com número gerado no formato NL-AAAA-NNNN: sequencial
     * dentro do ano da emissão, sem repetir nem pular, mesmo com emissões simultâneas. Remetente e entradas
     * passam pelas mesmas validações do registro.
     */
    NotaResponseDTO emitirLocal(NotaLocalRequestDTO request, Usuario emitidoPor);

    /**
     * Corrige uma nota PENDENTE com as mesmas regras do registro. A lista de entradas substitui os
     * vínculos atuais; {@code registradoPor} e {@code criadoEm} não mudam. Numa nota LOCAL, o número e o
     * tipo nunca mudam: o número enviado é ignorado.
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

    /**
     * Resumo das notas com os filtros informados, combinados com E; filtro nulo não é aplicado.
     * Da nota mais antiga para a mais recente (US30/#292).
     *
     * @throws br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException dataFim antes de dataInicio (400).
     */
    List<NotaResumoDTO> listar(StatusNota status, TipoNota tipo, UUID remetenteId,
                               LocalDate dataInicio, LocalDate dataFim);

    /**
     * Detalhe completo da nota, com entradas, documento e decisão.
     *
     * @throws br.ifpe.gestaorefeitorio.exception.NotaNaoEncontradaException nota inexistente (404).
     */
    NotaResponseDTO buscarPorId(UUID id);
}
