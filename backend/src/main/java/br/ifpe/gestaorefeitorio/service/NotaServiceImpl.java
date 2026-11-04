package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoJaVinculadaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEntradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacoesRepetidasException;
import br.ifpe.gestaorefeitorio.exception.NotaJaCadastradaException;
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
import java.util.ArrayList;
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
        String numero = request.numero().trim();
        log.debug("Registro de nota: numero {}, data {}, remetente {}, movimentacoes {}",
                numero, request.data(), request.remetenteId(), request.movimentacaoIds());

        if (new HashSet<>(request.movimentacaoIds()).size() != request.movimentacaoIds().size()) {
            throw new MovimentacoesRepetidasException();
        }

        Remetente remetente = buscarRemetenteAtivo(request.remetenteId());

        // Remetentes diferentes podem repetir a numeração; o número só é único por remetente.
        if (notaRepository.existsByRemetenteIdAndNumero(remetente.getId(), numero)) {
            log.info("Registro de nota negado: número {} já usado pelo remetente {}", numero, remetente.getId());
            throw new NotaJaCadastradaException();
        }

        List<Movimentacao> entradas = request.movimentacaoIds().stream()
                .map(this::buscarEntradaDisponivel)
                .toList();

        Nota nota = new Nota();
        nota.setNumero(numero);
        nota.setData(request.data());
        nota.setRemetente(remetente);
        nota.setMovimentacoes(new ArrayList<>(entradas));
        nota.setStatus(StatusNota.PENDENTE);
        nota.setObservacoes(request.observacoes() == null || request.observacoes().isBlank()
                ? null
                : request.observacoes().trim());
        nota.setRegistradoPor(registradoPor);
        nota = notaRepository.save(nota);

        log.info("Nota registrada: {} (número {}), remetente {} ({}), {} entrada(s), por {}",
                nota.getId(), nota.getNumero(), remetente.getId(), remetente.getNome(),
                entradas.size(), registradoPor.getEmail());
        return paraDTO(nota);
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

    private Remetente buscarRemetenteAtivo(UUID id) {
        Remetente remetente = remetenteRepository.findById(id)
                .orElseThrow(() -> new RemetenteNaoEncontradoException(id));
        if (!remetente.isAtivo()) {
            log.info("Registro de nota negado: remetente {} inativo", id);
            throw new RemetenteInativoException(id);
        }
        return remetente;
    }

    private Movimentacao buscarEntradaDisponivel(UUID id) {
        Movimentacao movimentacao = movimentacaoRepository.findById(id)
                .orElseThrow(() -> new MovimentacaoNaoEncontradaException(id));
        if (movimentacao.getTipo() != TipoMovimentacao.ENTRADA) {
            throw new MovimentacaoNaoEntradaException(id);
        }
        // O PK em nota_movimentacoes.movimentacao_id também barra isso no banco; aqui vira 409 legível.
        if (notaRepository.existsByMovimentacaoId(id)) {
            log.info("Registro de nota negado: movimentação {} já vinculada a outra nota", id);
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
