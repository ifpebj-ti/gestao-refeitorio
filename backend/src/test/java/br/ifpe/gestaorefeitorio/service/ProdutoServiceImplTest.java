package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Cobre os critérios de aceite da US04/#74 na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class ProdutoServiceImplTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private ProdutoServiceImpl produtoService;

    private Produto produtoComId(UUID id, String nome, String categoria, String unidadeMedida) {
        Produto produto = new Produto();
        produto.setId(id);
        produto.setNome(nome);
        produto.setCategoria(categoria);
        produto.setUnidadeMedida(unidadeMedida);
        produto.setValorReferencia(new BigDecimal("10.50"));
        return produto;
    }

    @Test
    void deveCadastrarProdutoMapeandoParaDTO() {
        ProdutoRequestDTO request = new ProdutoRequestDTO("Arroz", "Secos", "kg", new BigDecimal("8.90"));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(chamada -> {
            Produto salvo = chamada.getArgument(0);
            salvo.setId(UUID.randomUUID());
            return salvo;
        });

        ProdutoResponseDTO resposta = produtoService.cadastrar(request);

        assertThat(resposta.nome()).isEqualTo("Arroz");
        assertThat(resposta.categoria()).isEqualTo("Secos");
        assertThat(resposta.unidadeMedida()).isEqualTo("kg");
        assertThat(resposta.valorReferencia()).isEqualByComparingTo("8.90");
    }

    @Test
    void deveListarTodosMapeandoParaDTO() {
        Produto p1 = produtoComId(UUID.randomUUID(), "Arroz", "Secos", "kg");
        Produto p2 = produtoComId(UUID.randomUUID(), "Leite", "Frios", "L");
        when(produtoRepository.findAll()).thenReturn(List.of(p1, p2));

        List<ProdutoResponseDTO> resposta = produtoService.listarTodos();

        assertThat(resposta).hasSize(2);
        assertThat(resposta.get(0).nome()).isEqualTo("Arroz");
        assertThat(resposta.get(1).nome()).isEqualTo("Leite");
    }

    @Test
    void deveBuscarPorIdQuandoExiste() {
        UUID id = UUID.randomUUID();
        Produto produto = produtoComId(id, "Feijão", "Secos", "kg");
        when(produtoRepository.findById(id)).thenReturn(Optional.of(produto));

        ProdutoResponseDTO resposta = produtoService.buscarPorId(id);

        assertThat(resposta.id()).isEqualTo(id);
        assertThat(resposta.nome()).isEqualTo("Feijão");
    }

    @Test
    void deveLancarNaoEncontradoQuandoBuscarPorIdInexistente() {
        UUID id = UUID.randomUUID();
        when(produtoRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ProdutoNaoEncontradoException.class, () -> produtoService.buscarPorId(id));
    }

    @Test
    void deveAtualizarUnidadeMedidaMapeandoParaDTO() {
        UUID id = UUID.randomUUID();
        Produto produto = produtoComId(id, "Arroz", "Secos", "kg");
        Usuario responsavel = new Usuario();
        responsavel.setNome("Nutri");
        responsavel.setEmail("nutri@ifpe.edu.br");
        responsavel.setPerfil(Perfil.NUTRICIONISTA);
        responsavel.setAtivo(true);

        when(produtoRepository.findById(id)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(chamada -> chamada.getArgument(0));

        ProdutoUnidadeMedidaDTO request = new ProdutoUnidadeMedidaDTO("g");
        ProdutoResponseDTO resposta = produtoService.atualizarUnidadeMedida(id, request, responsavel);

        assertThat(resposta.unidadeMedida()).isEqualTo("g");
    }

    @Test
    void deveLancarNaoEncontradoQuandoAtualizarUnidadeMedidaDeIdInexistente() {
        UUID id = UUID.randomUUID();
        Usuario responsavel = new Usuario();
        responsavel.setNome("Nutri");
        responsavel.setEmail("nutri@ifpe.edu.br");
        responsavel.setPerfil(Perfil.NUTRICIONISTA);
        responsavel.setAtivo(true);

        when(produtoRepository.findById(id)).thenReturn(Optional.empty());

        ProdutoUnidadeMedidaDTO request = new ProdutoUnidadeMedidaDTO("g");

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> produtoService.atualizarUnidadeMedida(id, request, responsavel));
    }
}
