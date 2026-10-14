package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.ProducaoInternaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProducaoInternaResponseDTO;
import br.ifpe.gestaorefeitorio.exception.LocalArmazenamentoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.ProducaoInterna;
import br.ifpe.gestaorefeitorio.model.SetorProdutivo;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProducaoInternaRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.SetorProdutivoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProducaoInternaServiceImpl implements ProducaoInternaService {

    private final ProducaoInternaRepository producaoInternaRepository;
    private final SetorProdutivoRepository setorProdutivoRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final ProdutoRepository produtoRepository;
    private final LocalArmazenamentoRepository localArmazenamentoRepository;

    @Override
    @Transactional
    public ProducaoInternaResponseDTO registrarRecebimento(ProducaoInternaRequestDTO request, Usuario responsavel) {
        Produto produto = produtoRepository.findById(request.produtoId())
                .orElseThrow(() -> new ProdutoNaoEncontradoException(request.produtoId()));
        LocalArmazenamento local = localArmazenamentoRepository.findById(request.localId())
                .orElseThrow(() -> new LocalArmazenamentoNaoEncontradoException(request.localId()));
        SetorProdutivo setor = buscarOuCriarSetor(request.setorOrigem());

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setOrigem(OrigemMovimentacao.INTERNA);
        movimentacao.setQuantidade(request.quantidade());
        movimentacao.setData(request.data());
        movimentacao.setResponsavel(responsavel);
        movimentacao = movimentacaoRepository.save(movimentacao);

        ProducaoInterna producaoInterna = new ProducaoInterna();
        producaoInterna.setMovimentacao(movimentacao);
        producaoInterna.setSetor(setor);
        producaoInterna.setResponsavelSetor(request.responsavelSetor());
        producaoInternaRepository.save(producaoInterna);

        BigDecimal saldo = movimentacaoRepository.calcularSaldo(produto.getId(), local.getId());

        log.info("Recebimento de produção interna registrado: produto {} ({}), local {}, setor {}, quantidade {}, por {}",
                produto.getId(), produto.getNome(), local.getNome(), setor.getNome(), movimentacao.getQuantidade(),
                responsavel.getEmail());

        return new ProducaoInternaResponseDTO(
                movimentacao.getId(),
                produto.getId(),
                produto.getNome(),
                local.getId(),
                local.getNome(),
                movimentacao.getQuantidade(),
                movimentacao.getData(),
                setor.getNome(),
                producaoInterna.getResponsavelSetor(),
                saldo);
    }

    // Setor produtivo é cadastrável dinamicamente (CLAUDE.md seção 13.7 / issue #142) — sem
    // endpoint de CRUD próprio, criado sob demanda na primeira vez que o nome aparece.
    private SetorProdutivo buscarOuCriarSetor(String nome) {
        String nomeNormalizado = nome.trim();
        return setorProdutivoRepository.findByNomeIgnoreCase(nomeNormalizado)
                .orElseGet(() -> {
                    SetorProdutivo novoSetor = new SetorProdutivo();
                    novoSetor.setNome(nomeNormalizado);
                    return setorProdutivoRepository.save(novoSetor);
                });
    }
}
