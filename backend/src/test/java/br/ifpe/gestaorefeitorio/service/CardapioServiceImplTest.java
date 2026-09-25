package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.CardapioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.CardapioResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ItemCardapioRequestDTO;
import br.ifpe.gestaorefeitorio.exception.CardapioNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Cardapio;
import br.ifpe.gestaorefeitorio.model.ItemCardapio;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.CardapioRepository;
import br.ifpe.gestaorefeitorio.repository.ItemCardapioRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da US17/#154 na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class CardapioServiceImplTest {

    @Mock
    private CardapioRepository cardapioRepository;

    @Mock
    private ItemCardapioRepository itemCardapioRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private CardapioServiceImpl cardapioService;

    private Produto produtoComId(UUID id, String nome) {
        Produto produto = new Produto();
        produto.setId(id);
        produto.setNome(nome);
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        return produto;
    }

    private void mockearSalvamento() {
        when(cardapioRepository.save(any(Cardapio.class))).thenAnswer(chamada -> {
            Cardapio salvo = chamada.getArgument(0);
            salvo.setId(UUID.randomUUID());
            return salvo;
        });
        when(itemCardapioRepository.saveAll(anyList())).thenAnswer(chamada -> {
            List<ItemCardapio> itens = chamada.getArgument(0);
            itens.forEach(item -> item.setId(UUID.randomUUID()));
            return itens;
        });
    }

    @Test
    void deveCadastrarCardapioCriandoItensComProjecaoDeConsumo() {
        UUID produtoId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId, "Arroz");
        CardapioRequestDTO request = new CardapioRequestDTO(
                "Almoço", LocalDate.now(), 50,
                List.of(new ItemCardapioRequestDTO(produtoId, new BigDecimal("0.200"))));

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        mockearSalvamento();

        CardapioResponseDTO resposta = cardapioService.cadastrar(request);

        assertThat(resposta.refeicao()).isEqualTo("Almoço");
        assertThat(resposta.pessoasEstimadas()).isEqualTo(50);
        assertThat(resposta.itens()).hasSize(1);
        assertThat(resposta.itens().get(0).produtoId()).isEqualTo(produtoId);
        assertThat(resposta.itens().get(0).quantidadePorPessoa()).isEqualByComparingTo("0.200");
        assertThat(resposta.itens().get(0).projecaoConsumo()).isEqualByComparingTo("10.000");

        verify(cardapioRepository).save(any(Cardapio.class));
        verify(itemCardapioRepository).saveAll(anyList());
    }

    @Test
    void deveLancarProdutoNaoEncontradoQuandoItemReferenciaProdutoInexistente() {
        UUID produtoId = UUID.randomUUID();
        CardapioRequestDTO request = new CardapioRequestDTO(
                "Jantar", LocalDate.now(), 20,
                List.of(new ItemCardapioRequestDTO(produtoId, new BigDecimal("0.150"))));

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.empty());

        assertThrows(ProdutoNaoEncontradoException.class, () -> cardapioService.cadastrar(request));

        verifyNoInteractions(cardapioRepository, itemCardapioRepository);
    }

    @Test
    void deveLancarCardapioNaoEncontradoAoBuscarPorIdInexistente() {
        UUID id = UUID.randomUUID();
        when(cardapioRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(CardapioNaoEncontradoException.class, () -> cardapioService.buscarPorId(id));

        verifyNoInteractions(itemCardapioRepository);
    }
}
