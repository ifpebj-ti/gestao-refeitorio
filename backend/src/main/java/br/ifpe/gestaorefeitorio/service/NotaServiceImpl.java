package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
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
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoSpecifications;
import br.ifpe.gestaorefeitorio.repository.NotaRepository;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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

    @Override
    @Transactional
    public NotaResponseDTO registrar(NotaRequestDTO request, Usuario registradoPor) {
        log.debug("Registro de nota: numero {}, data {}, remetente {}, movimentacoes {}",
                request.numero(), request.data(), request.remetenteId(), request.movimentacaoIds());

        Nota nota = new Nota();
        nota.setStatus(StatusNota.PENDENTE);
        nota.setRegistradoPor(registradoPor);
        validarEAplicar(nota, request);
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

        Nota nota = notaRepository.findById(id)
                .orElseThrow(() -> new NotaNaoEncontradaException(id));
        if (nota.getStatus() != StatusNota.PENDENTE) {
            log.info("Edição da nota {} negada: status {}", id, nota.getStatus());
            throw new NotaNaoPendenteException(nota.getStatus());
        }

        validarEAplicar(nota, request);
        nota = notaRepository.save(nota);

        log.info("Nota editada: {} (número {}), {} entrada(s), por {}",
                nota.getId(), nota.getNumero(), nota.getMovimentacoes().size(), editadoPor.getEmail());
        return paraDTO(nota);
    }

    /**
     * Regras comuns ao registro e à edição. Nota sem ID é registro; com ID, é edição e as checagens de
     * duplicidade ignoram a própria nota. Tudo é validado antes de alterar a nota: as consultas abaixo
     * podem disparar flush, e uma nota alterada pela metade iria para o banco.
     */
    private void validarEAplicar(Nota nota, NotaRequestDTO request) {
        UUID notaId = nota.getId();
        String numero = request.numero().trim();

        if (new HashSet<>(request.movimentacaoIds()).size() != request.movimentacaoIds().size()) {
            throw new MovimentacoesRepetidasException();
        }

        Remetente remetente = buscarRemetente(request.remetenteId(), nota.getRemetente());

        // Remetentes diferentes podem repetir a numeração; o número só é único por remetente.
        boolean numeroEmUso = notaId == null
                ? notaRepository.existsByRemetenteIdAndNumero(remetente.getId(), numero)
                : notaRepository.existsByRemetenteIdAndNumeroAndIdNot(remetente.getId(), numero, notaId);
        if (numeroEmUso) {
            log.info("Nota negada: número {} já usado pelo remetente {}", numero, remetente.getId());
            throw new NotaJaCadastradaException();
        }

        List<Movimentacao> entradas = request.movimentacaoIds().stream()
                .map(movimentacaoId -> buscarEntradaDisponivel(movimentacaoId, notaId))
                .toList();

        nota.setNumero(numero);
        nota.setData(request.data());
        nota.setRemetente(remetente);
        // Substitui os vínculos: entrada retirada da lista volta a ficar disponível (#288).
        nota.getMovimentacoes().clear();
        nota.getMovimentacoes().addAll(entradas);
        nota.setObservacoes(request.observacoes() == null || request.observacoes().isBlank()
                ? null
                : request.observacoes().trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotaEntradaDTO> listarEntradasDisponiveis(LocalDate dataInicio, LocalDate dataFim, UUID produtoId,
                                                          String fornecedor) {
        log.debug("Listagem de entradas disponíveis: dataInicio {}, dataFim {}, produto {}, fornecedor '{}'",
                dataInicio, dataFim, produtoId, fornecedor);

        if (dataInicio != null && dataFim != null && dataFim.isBefore(dataInicio)) {
            throw new PeriodoInvalidoException();
        }

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

    private NotaResponseDTO paraDTO(Nota nota) {
        Remetente remetente = nota.getRemetente();
        Usuario registradoPor = nota.getRegistradoPor();
        return new NotaResponseDTO(
                nota.getId(),
                nota.getNumero(),
                nota.getData(),
                nota.getStatus(),
                new NotaResponseDTO.RemetenteResumo(remetente.getId(), remetente.getNome()),
                nota.getMovimentacoes().stream().map(this::paraEntradaDTO).toList(),
                new NotaResponseDTO.RegistradoPor(registradoPor.getId(), registradoPor.getNome(),
                        registradoPor.getEmail()),
                nota.getObservacoes(),
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
