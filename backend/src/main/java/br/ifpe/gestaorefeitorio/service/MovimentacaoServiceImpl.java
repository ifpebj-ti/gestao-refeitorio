package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoSaidaRequestDTO;
import br.ifpe.gestaorefeitorio.exception.LocalArmazenamentoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
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

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setQuantidade(request.quantidade());
        movimentacao.setData(request.data());
        movimentacao.setOrigem(request.origem());
        movimentacao.setValor(request.valor());
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
                saldo);
    }

    // NOVO MÉTODO: Cria o DTO sem tentar calcular o saldo no banco de dados!
    private MovimentacaoResponseDTO paraDTOHistorico(Movimentacao movimentacao) {
        Produto produto = movimentacao.getProduto();
        LocalArmazenamento local = movimentacao.getLocal();

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
                BigDecimal.ZERO); // Mandamos ZERO no saldo, pois a tela de histórico não usa!
    }
}