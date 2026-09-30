package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.CardapioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.CardapioResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ItemCardapioResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProjecaoConsumoDTO;
import br.ifpe.gestaorefeitorio.exception.CardapioNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Cardapio;
import br.ifpe.gestaorefeitorio.model.ItemCardapio;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.CardapioRepository;
import br.ifpe.gestaorefeitorio.repository.ItemCardapioRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardapioServiceImpl implements CardapioService {

    private final CardapioRepository cardapioRepository;
    private final ItemCardapioRepository itemCardapioRepository;
    private final ProdutoRepository produtoRepository;

    @Override
    @Transactional
    public CardapioResponseDTO cadastrar(CardapioRequestDTO request) {
        // Valida todos os produtos antes de gravar qualquer coisa — se algum não existir,
        // a transação inteira é revertida (nenhum cardápio "pela metade" fica persistido).
        List<Produto> produtos = request.itens().stream()
                .map(item -> produtoRepository.findById(item.produtoId())
                        .orElseThrow(() -> new ProdutoNaoEncontradoException(item.produtoId())))
                .toList();

        Cardapio cardapio = new Cardapio();
        cardapio.setRefeicao(request.refeicao());
        cardapio.setData(request.data());
        cardapio.setPessoasEstimadas(request.pessoasEstimadas());
        cardapio = cardapioRepository.save(cardapio);

        Cardapio cardapioSalvo = cardapio;
        List<ItemCardapio> itens = IntStream.range(0, request.itens().size())
                .mapToObj(i -> {
                    ItemCardapio item = new ItemCardapio();
                    item.setCardapio(cardapioSalvo);
                    item.setProduto(produtos.get(i));
                    item.setQuantidadePorPessoa(request.itens().get(i).quantidadePorPessoa());
                    return item;
                })
                .toList();
        itemCardapioRepository.saveAll(itens);

        log.info("Cardápio cadastrado: {} ({}), {} pessoas estimadas, {} item(ns)",
                cardapio.getRefeicao(), cardapio.getData(), cardapio.getPessoasEstimadas(), itens.size());

        return paraDTO(cardapio, itens);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CardapioResponseDTO> listarTodos() {
        return cardapioRepository.findAll().stream()
                .map(cardapio -> paraDTO(cardapio, itemCardapioRepository.findByCardapioId(cardapio.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CardapioResponseDTO buscarPorId(UUID id) {
        Cardapio cardapio = cardapioRepository.findById(id)
                .orElseThrow(() -> new CardapioNaoEncontradoException(id));
        return paraDTO(cardapio, itemCardapioRepository.findByCardapioId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjecaoConsumoDTO> projetarConsumoPorPeriodo(LocalDate dataInicio, LocalDate dataFim) {
        if (dataFim.isBefore(dataInicio)) {
            throw new PeriodoInvalidoException();
        }
        return itemCardapioRepository.projetarConsumoPorPeriodo(dataInicio, dataFim);
    }

    private CardapioResponseDTO paraDTO(Cardapio cardapio, List<ItemCardapio> itens) {
        List<ItemCardapioResponseDTO> itensDTO = itens.stream()
                .map(item -> paraItemDTO(item, cardapio.getPessoasEstimadas()))
                .toList();

        return new CardapioResponseDTO(
                cardapio.getId(),
                cardapio.getRefeicao(),
                cardapio.getData(),
                cardapio.getPessoasEstimadas(),
                itensDTO);
    }

    // Projeção de consumo calculada em tempo de leitura, nunca persistida (CLAUDE.md seção 4).
    private ItemCardapioResponseDTO paraItemDTO(ItemCardapio item, Integer pessoasEstimadas) {
        BigDecimal projecaoConsumo = item.getQuantidadePorPessoa().multiply(BigDecimal.valueOf(pessoasEstimadas));

        return new ItemCardapioResponseDTO(
                item.getId(),
                item.getProduto().getId(),
                item.getProduto().getNome(),
                item.getQuantidadePorPessoa(),
                projecaoConsumo);
    }
}
