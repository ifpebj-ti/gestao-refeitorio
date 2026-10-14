package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoSaidaRequestDTO;
import br.ifpe.gestaorefeitorio.exception.DataValidadeInvalidaException;
import br.ifpe.gestaorefeitorio.exception.LocalArmazenamentoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.SaldoInsuficienteException;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovimentacaoServiceImpl implements MovimentacaoService {

    private final MovimentacaoRepository movimentacaoRepository;
    private final ProdutoRepository produtoRepository;
    private final LocalArmazenamentoRepository localArmazenamentoRepository;

    @Override
    public MovimentacaoResponseDTO registrarEntrada(MovimentacaoRequestDTO request, Usuario responsavel) {
        ProdutoELocal produtoELocal = buscarProdutoELocal(request.produtoId(), request.localId());
        Produto produto = produtoELocal.produto();
        LocalArmazenamento local = produtoELocal.local();

        // dataValidade é opcional (US14/#145) — nem todo produto tem controle de validade.
        if (request.dataValidade() != null && request.dataValidade().isBefore(request.data())) {
            throw new DataValidadeInvalidaException();
        }

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setQuantidade(request.quantidade());
        movimentacao.setData(request.data());
        movimentacao.setOrigem(request.origem());
        movimentacao.setValor(request.valor());
        movimentacao.setDataValidade(request.dataValidade());
        movimentacao.setFornecedor(request.fornecedor());
        movimentacao.setResponsavel(responsavel);
        movimentacao = movimentacaoRepository.save(movimentacao);

        log.info("Entrada registrada: produto {} ({}), local {}, quantidade {}, por {}",
                produto.getId(), produto.getNome(), local.getNome(), movimentacao.getQuantidade(),
                responsavel.getEmail());

        return paraDTO(movimentacao);
    }

    @Override
    public MovimentacaoResponseDTO registrarSaida(MovimentacaoSaidaRequestDTO request, Usuario responsavel) {
        ProdutoELocal produtoELocal = buscarProdutoELocal(request.produtoId(), request.localId());
        Produto produto = produtoELocal.produto();
        LocalArmazenamento local = produtoELocal.local();

        // Saldo validado por produto e por local (CLAUDE.md seção 5) — nunca o saldo total do produto.
        BigDecimal saldoDisponivel = movimentacaoRepository.calcularSaldo(produto.getId(), local.getId());
        if (saldoDisponivel.subtract(request.quantidade()).signum() < 0) {
            log.info("Saída bloqueada por saldo insuficiente: produto {} ({}), local {}, disponível {}, solicitado {}, por {}",
                    produto.getId(), produto.getNome(), local.getNome(), saldoDisponivel, request.quantidade(),
                    responsavel.getEmail());
            throw new SaldoInsuficienteException(saldoDisponivel, request.quantidade());
        }

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setTipo(TipoMovimentacao.SAIDA);
        movimentacao.setTipoSaida(request.tipoSaida());
        movimentacao.setQuantidade(request.quantidade());
        movimentacao.setData(request.data());
        movimentacao.setResponsavel(responsavel);
        movimentacao = movimentacaoRepository.save(movimentacao);

        log.info("Saída registrada: produto {} ({}), local {}, quantidade {}, tipo {}, por {}",
                produto.getId(), produto.getNome(), local.getNome(), movimentacao.getQuantidade(),
                movimentacao.getTipoSaida(), responsavel.getEmail());

        return paraDTO(movimentacao);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoResponseDTO> listarHistorico() {
        return movimentacaoRepository.findAll().stream()
                .map(this::paraDTOHistorico) // Aqui mudamos para usar o DTO simplificado
                .collect(Collectors.toList());
    }

    private ProdutoELocal buscarProdutoELocal(UUID produtoId, UUID localId) {
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ProdutoNaoEncontradoException(produtoId));
        LocalArmazenamento local = localArmazenamentoRepository.findById(localId)
                .orElseThrow(() -> new LocalArmazenamentoNaoEncontradoException(localId));
        return new ProdutoELocal(produto, local);
    }

    private record ProdutoELocal(Produto produto, LocalArmazenamento local) {
    }

    private MovimentacaoResponseDTO paraDTO(Movimentacao movimentacao) {
        Produto produto = movimentacao.getProduto();
        LocalArmazenamento local = movimentacao.getLocal();
        Usuario responsavel = movimentacao.getResponsavel();
        BigDecimal saldo = movimentacaoRepository.calcularSaldo(produto.getId(), local.getId());

        return new MovimentacaoResponseDTO(
                movimentacao.getId(),
                produto.getId(),
                produto.getNome(),
                local.getId(),
                local.getNome(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getData(),
                movimentacao.getOrigem(),
                movimentacao.getTipoSaida(),
                movimentacao.getValor(),
                movimentacao.getDataValidade(),
                saldo,
                responsavel != null ? responsavel.getNome() : null,
                responsavel != null ? responsavel.getEmail() : null,
                responsavel != null && responsavel.getPerfil() != null ? responsavel.getPerfil().name() : null,
                movimentacao.getFornecedor());
    }

    private MovimentacaoResponseDTO paraDTOHistorico(Movimentacao movimentacao) {
        Produto produto = movimentacao.getProduto();
        LocalArmazenamento local = movimentacao.getLocal();
        Usuario responsavel = movimentacao.getResponsavel();
        BigDecimal saldo = movimentacaoRepository.calcularSaldo(produto.getId(), local.getId());

        return new MovimentacaoResponseDTO(
                movimentacao.getId(),
                produto.getId(),
                produto.getNome(),
                local.getId(),
                local.getNome(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getData(),
                movimentacao.getOrigem(),
                movimentacao.getTipoSaida(),
                movimentacao.getValor(),
                movimentacao.getDataValidade(),
                saldo,
                responsavel != null ? responsavel.getNome() : null,
                responsavel != null ? responsavel.getEmail() : null,
                responsavel != null && responsavel.getPerfil() != null ? responsavel.getPerfil().name() : null,
                movimentacao.getFornecedor());
    }
}