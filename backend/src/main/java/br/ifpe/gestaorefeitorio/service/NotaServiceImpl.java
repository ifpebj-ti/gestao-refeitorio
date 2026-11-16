package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaCancelamentoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaLocalRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResumoDTO;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoJaVinculadaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEntradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacoesRepetidasException;
import br.ifpe.gestaorefeitorio.exception.NotaJaCadastradaException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoPendenteException;
import br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.RemetenteInativoException;
import br.ifpe.gestaorefeitorio.exception.RemetenteNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.NotaLocalSequencia;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoNota;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoSpecifications;
import br.ifpe.gestaorefeitorio.repository.NotaDocumentoRepository;
import br.ifpe.gestaorefeitorio.repository.NotaLocalSequenciaRepository;
import br.ifpe.gestaorefeitorio.repository.NotaRepository;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotaServiceImpl implements NotaService {

    // Desempate por criadoEm: várias entradas no mesmo dia mantêm a mesma ordem entre chamadas.
    private static final Sort ORDEM_MAIS_RECENTE = Sort.by(Sort.Direction.DESC, "data", "criadoEm");

    private final NotaRepository notaRepository;
    private final RemetenteRepository remetenteRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final NotaDocumentoRepository notaDocumentoRepository;
    private final NotaLocalSequenciaRepository notaLocalSequenciaRepository;
    private final Clock clock;

    // O ano do número da nota local é o da emissão no horário de Recife, o mesmo fuso dos jobs.
    private static final ZoneId FUSO = ZoneId.of("America/Recife");

    @Override
    @Transactional
    public NotaResponseDTO emitirLocal(NotaLocalRequestDTO request, Usuario emitidoPor) {
        log.debug("Emissão de nota local: data {}, remetente {}, movimentacoes {}",
                request.data(), request.remetenteId(), request.movimentacaoIds());

        Nota nota = new Nota();
        nota.setStatus(StatusNota.PENDENTE);
        nota.setTipo(TipoNota.LOCAL);
        nota.setRegistradoPor(emitidoPor);
        nota.setResponsavelEntrega(request.responsavelEntrega().trim());
        validarEAplicar(nota, gerarNumeroLocal(), request.data(), request.remetenteId(),
                request.movimentacaoIds(), request.observacoes());
        nota = notaRepository.save(nota);

        log.info("Nota local emitida: {} (número {}), remetente {}, por {}",
                nota.getId(), nota.getNumero(), nota.getRemetente().getId(), emitidoPor.getEmail());
        return paraDTO(nota);
    }

    // O contador sobe na mesma transação da nota: se ela falhar, o número volta e não fica buraco.
    // A linha do ano fica travada até o fim da transação, então emissões simultâneas saem em sequência.
    private String gerarNumeroLocal() {
        int ano = clock.instant().atZone(FUSO).getYear();
        notaLocalSequenciaRepository.criarSeNaoExistir(ano);
        NotaLocalSequencia sequencia = notaLocalSequenciaRepository.buscarParaAtualizar(ano)
                .orElseThrow(() -> new IllegalStateException("Contador de notas locais ausente para " + ano));
        sequencia.setUltimoNumero(sequencia.getUltimoNumero() + 1);
        notaLocalSequenciaRepository.save(sequencia);
        return "NL-%d-%04d".formatted(ano, sequencia.getUltimoNumero());
    }

    @Override
    @Transactional
    public NotaResponseDTO registrar(NotaRequestDTO request, Usuario registradoPor) {
        log.debug("Registro de nota: numero {}, data {}, remetente {}, movimentacoes {}",
                request.numero(), request.data(), request.remetenteId(), request.movimentacaoIds());

        Nota nota = new Nota();
        nota.setStatus(StatusNota.PENDENTE);
        nota.setTipo(TipoNota.EXTERNA);
        nota.setRegistradoPor(registradoPor);
        validarEAplicar(nota, request.numero().trim(), request.data(), request.remetenteId(),
                request.movimentacaoIds(), request.observacoes());
        nota = notaRepository.save(nota);

        log.info("Nota registrada: {} (número {}), remetente {} ({}), {} entrada(s), por {}",
                nota.getId(), nota.getNumero(), nota.getRemetente().getId(), nota.getRemetente().getNome(),
                nota.getMovimentacoes().size(), registradoPor.getEmail());
        return paraDTO(nota);
    }

    @Override
    @Transactional
    public NotaResponseDTO editar(UUID id, NotaRequestDTO request, Usuario editadoPor) {
        log.debug("Edição da nota {}: numero {}, data {}, remetente {}, movimentacoes {}",
                id, request.numero(), request.data(), request.remetenteId(), request.movimentacaoIds());

        Nota nota = buscarPendente(id, "Edição");

        // O número de uma nota local é gerado pelo sistema e nunca muda: o do corpo é ignorado (#293).
        String numero = nota.getTipo() == TipoNota.LOCAL ? nota.getNumero() : request.numero().trim();
        validarEAplicar(nota, numero, request.data(), request.remetenteId(),
                request.movimentacaoIds(), request.observacoes());
        nota = notaRepository.save(nota);

        log.info("Nota editada: {} (número {}), {} entrada(s), por {}",
                nota.getId(), nota.getNumero(), nota.getMovimentacoes().size(), editadoPor.getEmail());
        return paraDTO(nota);
    }

    @Override
    @Transactional
    public NotaResponseDTO validar(UUID id, Usuario decidiuPor) {
        Nota nota = buscarPendente(id, "Validação");
        nota.setStatus(StatusNota.VALIDADA);
        registrarDecisao(nota, decidiuPor);
        nota = notaRepository.save(nota);

        log.info("Nota validada: {} (número {}), por {}", nota.getId(), nota.getNumero(), decidiuPor.getEmail());
        return paraDTO(nota);
    }

    @Override
    @Transactional
    public NotaResponseDTO cancelar(UUID id, NotaCancelamentoRequestDTO request, Usuario decidiuPor) {
        Nota nota = buscarPendente(id, "Cancelamento");
        nota.setStatus(StatusNota.CANCELADA);
        nota.setJustificativaCancelamento(request.justificativa().trim());
        registrarDecisao(nota, decidiuPor);
        // Cancelar não estorna nem desvincula as entradas: elas continuam no estoque e ligadas à nota.
        nota = notaRepository.save(nota);

        // A justificativa não vai para o log: pode conter dados do fornecedor.
        log.info("Nota cancelada: {} (número {}), por {}", nota.getId(), nota.getNumero(), decidiuPor.getEmail());
        return paraDTO(nota);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotaResumoDTO> listar(StatusNota status, TipoNota tipo, UUID remetenteId,
                                      LocalDate dataInicio, LocalDate dataFim) {
        log.debug("Listagem de notas: status {}, tipo {}, remetente {}, dataInicio {}, dataFim {}",
                status, tipo, remetenteId, dataInicio, dataFim);
        validarPeriodo(dataInicio, dataFim);
        return notaRepository.listarResumos(status, tipo, remetenteId, dataInicio, dataFim);
    }

    @Override
    @Transactional(readOnly = true)
    public NotaResponseDTO buscarPorId(UUID id) {
        return paraDTO(notaRepository.findById(id).orElseThrow(() -> new NotaNaoEncontradaException(id)));
    }

    private static void validarPeriodo(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio != null && dataFim != null && dataFim.isBefore(dataInicio)) {
            throw new PeriodoInvalidoException();
        }
    }

    private Nota buscarPendente(UUID id, String operacao) {
        Nota nota = notaRepository.findById(id)
                .orElseThrow(() -> new NotaNaoEncontradaException(id));
        if (nota.getStatus() != StatusNota.PENDENTE) {
            log.info("{} da nota {} negada: status {}", operacao, id, nota.getStatus());
            throw new NotaNaoPendenteException(nota.getStatus());
        }
        return nota;
    }

    private void registrarDecisao(Nota nota, Usuario decidiuPor) {
        nota.setValidadoPor(decidiuPor);
        nota.setValidadoEm(Instant.now());
    }

    /**
     * Regras comuns ao registro e à edição. Nota sem ID é registro; com ID, é edição e as checagens de
     * duplicidade ignoram a própria nota. Tudo é validado antes de alterar a nota: as consultas abaixo
     * podem disparar flush, e uma nota alterada pela metade iria para o banco.
     */
    private void validarEAplicar(Nota nota, String numero, LocalDate data, UUID remetenteId,
                                 List<UUID> movimentacaoIds, String observacoes) {
        UUID notaId = nota.getId();

        if (new HashSet<>(movimentacaoIds).size() != movimentacaoIds.size()) {
            throw new MovimentacoesRepetidasException();
        }

        Remetente remetente = buscarRemetente(remetenteId, nota.getRemetente());

        // Remetentes diferentes podem repetir a numeração; o número só é único por remetente.
        boolean numeroEmUso = notaId == null
                ? notaRepository.existsByRemetenteIdAndNumero(remetente.getId(), numero)
                : notaRepository.existsByRemetenteIdAndNumeroAndIdNot(remetente.getId(), numero, notaId);
        if (numeroEmUso) {
            log.info("Nota negada: número {} já usado pelo remetente {}", numero, remetente.getId());
            throw new NotaJaCadastradaException();
        }

        List<Movimentacao> entradas = movimentacaoIds.stream()
                .map(movimentacaoId -> buscarEntradaDisponivel(movimentacaoId, notaId))
                .toList();

        nota.setNumero(numero);
        nota.setData(data);
        nota.setRemetente(remetente);
        // Substitui os vínculos: entrada retirada da lista volta a ficar disponível (#288).
        nota.substituirMovimentacoes(entradas);
        nota.setObservacoes(observacoes == null || observacoes.isBlank() ? null : observacoes.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotaEntradaDTO> listarEntradasDisponiveis(LocalDate dataInicio, LocalDate dataFim, UUID produtoId,
                                                          String fornecedor) {
        log.debug("Listagem de entradas disponíveis: dataInicio {}, dataFim {}, produto {}, fornecedor '{}'",
                dataInicio, dataFim, produtoId, fornecedor);
        validarPeriodo(dataInicio, dataFim);

        return movimentacaoRepository.findAll(
                        MovimentacaoSpecifications.entradasDisponiveis(dataInicio, dataFim, produtoId,
                                padraoBuscaParcial(fornecedor)),
                        ORDEM_MAIS_RECENTE)
                .stream()
                .map(this::paraEntradaDTO)
                .toList();
    }

    // Escapa os curingas do LIKE: quem digita "%" ou "_" busca o caractere, não "qualquer coisa".
    static String padraoBuscaParcial(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        String escapado = texto.trim()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escapado + "%";
    }

    // Manter o remetente atual é permitido mesmo se ele foi inativado depois do registro; sem isso, a
    // nota PENDENTE não poderia mais ser corrigida. Só a troca para um remetente inativo é recusada.
    private Remetente buscarRemetente(UUID id, Remetente remetenteAtual) {
        Remetente remetente = remetenteRepository.findById(id)
                .orElseThrow(() -> new RemetenteNaoEncontradoException(id));
        boolean mantemAtual = remetenteAtual != null && remetenteAtual.getId().equals(id);
        if (!remetente.isAtivo() && !mantemAtual) {
            log.info("Nota negada: remetente {} inativo", id);
            throw new RemetenteInativoException(id);
        }
        return remetente;
    }

    private Movimentacao buscarEntradaDisponivel(UUID id, UUID notaId) {
        Movimentacao movimentacao = movimentacaoRepository.findById(id)
                .orElseThrow(() -> new MovimentacaoNaoEncontradaException(id));
        if (movimentacao.getTipo() != TipoMovimentacao.ENTRADA) {
            throw new MovimentacaoNaoEntradaException(id);
        }
        // O PK em nota_movimentacoes.movimentacao_id também barra isso no banco; aqui vira 409 legível.
        boolean vinculadaAOutra = notaId == null
                ? notaRepository.existsByMovimentacaoId(id)
                : notaRepository.existsByMovimentacaoIdAndNotaIdNot(id, notaId);
        if (vinculadaAOutra) {
            log.info("Nota negada: movimentação {} já vinculada a outra nota", id);
            throw new MovimentacaoJaVinculadaException(id);
        }
        return movimentacao;
    }

    private static NotaResponseDTO.RegistradoPor resumo(Usuario usuario) {
        return usuario == null ? null
                : new NotaResponseDTO.RegistradoPor(usuario.getId(), usuario.getNome(), usuario.getEmail());
    }

    private NotaResponseDTO paraDTO(Nota nota) {
        Remetente remetente = nota.getRemetente();
        Usuario registradoPor = nota.getRegistradoPor();
        return new NotaResponseDTO(
                nota.getId(),
                nota.getNumero(),
                nota.getTipo(),
                nota.getData(),
                nota.getStatus(),
                new NotaResponseDTO.RemetenteResumo(remetente.getId(), remetente.getNome()),
                nota.getMovimentacoes().stream().map(this::paraEntradaDTO).toList(),
                resumo(registradoPor),
                nota.getObservacoes(),
                nota.getResponsavelEntrega(),
                nota.getId() != null && notaDocumentoRepository.existsByNotaId(nota.getId()),
                resumo(nota.getValidadoPor()),
                nota.getValidadoEm(),
                nota.getJustificativaCancelamento(),
                nota.getCriadoEm());
    }

    private NotaEntradaDTO paraEntradaDTO(Movimentacao movimentacao) {
        return new NotaEntradaDTO(
                movimentacao.getId(),
                movimentacao.getProduto().getId(),
                movimentacao.getProduto().getNome(),
                movimentacao.getQuantidade(),
                movimentacao.getProduto().getUnidadeMedida(),
                movimentacao.getLocal().getId(),
                movimentacao.getLocal().getNome(),
                movimentacao.getLote(),
                movimentacao.getDataValidade(),
                movimentacao.getData(),
                movimentacao.getFornecedor());
    }
}
