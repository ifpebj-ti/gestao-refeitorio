package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoHistoricoDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoQuantidadeMinimaDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.dto.SaldoPorLocalDTO;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.ProducaoInterna;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProducaoInternaRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProdutoServiceImpl implements ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final ProducaoInternaRepository producaoInternaRepository;

    @Override
    public ProdutoResponseDTO cadastrar(ProdutoRequestDTO request) {
        Produto produto = new Produto();
        produto.setNome(request.nome());
        produto.setCategoria(request.categoria());
        produto.setUnidadeMedida(request.unidadeMedida());
        produto.setValorReferencia(request.valorReferencia());
        produto = produtoRepository.save(produto);

        log.info("Produto cadastrado: {} ({})", produto.getNome(), produto.getCategoria());
        return paraDTO(produto);
    }

    @Override
    public List<ProdutoResponseDTO> listarTodos() {
        return produtoRepository.findAll().stream()
                .map(this::paraDTO)
                .toList();
    }

    @Override
    public List<ProdutoResponseDTO> listarPorCategoria(String categoria) {
        return produtoRepository.findByCategoriaIgnoreCase(categoria).stream()
                .map(this::paraDTO)
                .toList();
    }

    @Override
    public ProdutoResponseDTO buscarPorId(UUID id) {
        return paraDTO(buscarEntidade(id));
    }

    @Override
    public ProdutoResponseDTO atualizarUnidadeMedida(UUID id, ProdutoUnidadeMedidaDTO request, Usuario responsavel) {
        Produto produto = buscarEntidade(id);
        String unidadeAnterior = produto.getUnidadeMedida();
        produto.setUnidadeMedida(request.unidadeMedida());
        produto = produtoRepository.save(produto);

        log.info("Unidade de medida alterada: produto {} ({}), {} -> {}, por {}",
                produto.getId(), produto.getNome(), unidadeAnterior, produto.getUnidadeMedida(),
                responsavel.getEmail());

        return paraDTO(produto);
    }

    @Override
    public ProdutoResponseDTO atualizarQuantidadeMinima(UUID id, ProdutoQuantidadeMinimaDTO request, Usuario responsavel) {
        Produto produto = buscarEntidade(id);
        BigDecimal quantidadeAnterior = produto.getQuantidadeMinima();
        produto.setQuantidadeMinima(request.quantidadeMinima());
        produto = produtoRepository.save(produto);

        log.info("Quantidade mínima alterada: produto {} ({}), {} -> {}, por {}",
                produto.getId(), produto.getNome(), quantidadeAnterior, produto.getQuantidadeMinima(),
                responsavel.getEmail());

        return paraDTO(produto);
    }

    @Override
    public List<SaldoPorLocalDTO> listarSaldoPorLocal(UUID produtoId) {
        buscarEntidade(produtoId); // valida que o produto existe (404 se não)
        return movimentacaoRepository.listarSaldoPorLocal(produtoId);
    }

    @Override
    public List<MovimentacaoHistoricoDTO> listarHistorico(UUID produtoId) {
        buscarEntidade(produtoId); // valida que o produto existe (404 se não)
        List<Movimentacao> movimentacoes = movimentacaoRepository.findByProdutoIdOrderByDataDesc(produtoId);

        // Só movimentações de produção interna (US13) têm registro em ProducaoInterna —
        // busca em lote pra não gerar uma query por linha do histórico.
        Map<UUID, ProducaoInterna> producoesPorMovimentacao = producaoInternaRepository
                .findByMovimentacaoIdIn(movimentacoes.stream().map(Movimentacao::getId).toList())
                .stream()
                .collect(Collectors.toMap(pi -> pi.getMovimentacao().getId(), Function.identity()));

        return movimentacoes.stream()
                .map(movimentacao -> paraHistoricoDTO(movimentacao, producoesPorMovimentacao.get(movimentacao.getId())))
                .toList();
    }

    private Produto buscarEntidade(UUID id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ProdutoNaoEncontradoException(id));
    }

    private ProdutoResponseDTO paraDTO(Produto produto) {
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getCategoria(),
                produto.getUnidadeMedida(),
                produto.getValorReferencia(),
                produto.getQuantidadeMinima(),
                movimentacaoRepository.calcularSaldoTotal(produto.getId()));
    }

    private MovimentacaoHistoricoDTO paraHistoricoDTO(Movimentacao movimentacao, ProducaoInterna producaoInterna) {
        return new MovimentacaoHistoricoDTO(
                movimentacao.getId(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getData(),
                movimentacao.getLocal().getId(),
                movimentacao.getLocal().getNome(),
                movimentacao.getOrigem(),
                movimentacao.getTipoSaida(),
                movimentacao.getValor(),
                movimentacao.getDataValidade(),
                movimentacao.getResponsavel().getNome(),
                movimentacao.getResponsavel().getEmail(),
                producaoInterna != null ? producaoInterna.getSetor().getNome() : null,
                producaoInterna != null ? producaoInterna.getResponsavelSetor() : null);
    }
}
