package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoHistoricoDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoControleValidadeDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoQuantidadeMinimaDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.dto.SaldoPorLocalDTO;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProducaoInternaRepository;
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
import static org.mockito.Mockito.when;

/**
 * Cobre os critérios de aceite da US04/#74 e da consulta de saldo (US10/#94/#95)
 * na camada de regra de negócio, mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class ProdutoServiceImplTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @Mock
    private ProducaoInternaRepository producaoInternaRepository;

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
        when(movimentacaoRepository.calcularSaldoTotal(any())).thenReturn(BigDecimal.ZERO);

        ProdutoResponseDTO resposta = produtoService.cadastrar(request);

        assertThat(resposta.nome()).isEqualTo("Arroz");
        assertThat(resposta.categoria()).isEqualTo("Secos");
        assertThat(resposta.unidadeMedida()).isEqualTo("kg");
        assertThat(resposta.valorReferencia()).isEqualByComparingTo("8.90");
        assertThat(resposta.saldoTotal()).isEqualByComparingTo("0");
    }

    @Test
    void deveListarTodosMapeandoParaDTO() {
        Produto p1 = produtoComId(UUID.randomUUID(), "Arroz", "Secos", "kg");
        Produto p2 = produtoComId(UUID.randomUUID(), "Leite", "Frios", "L");
        when(produtoRepository.findAllByOrderByNomeAsc()).thenReturn(List.of(p1, p2));
        when(movimentacaoRepository.calcularSaldoTotal(any())).thenReturn(BigDecimal.ZERO);

        List<ProdutoResponseDTO> resposta = produtoService.listarTodos();

        assertThat(resposta).hasSize(2);
        assertThat(resposta.get(0).nome()).isEqualTo("Arroz");
        assertThat(resposta.get(1).nome()).isEqualTo("Leite");
    }

    @Test
    void deveListarPorCategoriaMapeandoParaDTO() {
        Produto p1 = produtoComId(UUID.randomUUID(), "Leite", "Frios", "L");
        when(produtoRepository.findByCategoriaIgnoreCaseOrderByNomeAsc("Frios")).thenReturn(List.of(p1));
        when(movimentacaoRepository.calcularSaldoTotal(any())).thenReturn(BigDecimal.ZERO);

        List<ProdutoResponseDTO> resposta = produtoService.listarPorCategoria("Frios");

        assertThat(resposta).hasSize(1);
        assertThat(resposta.get(0).nome()).isEqualTo("Leite");
    }

    @Test
    void deveListarPorCategoriaRetornandoListaVaziaQuandoSemCorrespondencia() {
        when(produtoRepository.findByCategoriaIgnoreCaseOrderByNomeAsc("Bebidas")).thenReturn(List.of());

        List<ProdutoResponseDTO> resposta = produtoService.listarPorCategoria("Bebidas");

        assertThat(resposta).isEmpty();
    }

    @Test
    void deveBuscarPorIdQuandoExiste() {
        UUID id = UUID.randomUUID();
        Produto produto = produtoComId(id, "Feijão", "Secos", "kg");
        when(produtoRepository.findById(id)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.calcularSaldoTotal(id)).thenReturn(new BigDecimal("15"));

        ProdutoResponseDTO resposta = produtoService.buscarPorId(id);

        assertThat(resposta.id()).isEqualTo(id);
        assertThat(resposta.nome()).isEqualTo("Feijão");
        assertThat(resposta.saldoTotal()).isEqualByComparingTo("15");
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
        when(movimentacaoRepository.calcularSaldoTotal(id)).thenReturn(BigDecimal.ZERO);

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

    @Test
    void deveAtualizarQuantidadeMinimaMapeandoParaDTO() {
        UUID id = UUID.randomUUID();
        Produto produto = produtoComId(id, "Arroz", "Secos", "kg");
        Usuario responsavel = new Usuario();
        responsavel.setNome("Nutri");
        responsavel.setEmail("nutri@ifpe.edu.br");
        responsavel.setPerfil(Perfil.NUTRICIONISTA);
        responsavel.setAtivo(true);

        when(produtoRepository.findById(id)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(chamada -> chamada.getArgument(0));
        when(movimentacaoRepository.calcularSaldoTotal(id)).thenReturn(BigDecimal.ZERO);

        ProdutoQuantidadeMinimaDTO request = new ProdutoQuantidadeMinimaDTO(new BigDecimal("5"));
        ProdutoResponseDTO resposta = produtoService.atualizarQuantidadeMinima(id, request, responsavel);

        assertThat(resposta.quantidadeMinima()).isEqualByComparingTo("5");
    }

    @Test
    void deveLancarNaoEncontradoQuandoAtualizarQuantidadeMinimaDeIdInexistente() {
        UUID id = UUID.randomUUID();
        Usuario responsavel = new Usuario();
        responsavel.setNome("Nutri");
        responsavel.setEmail("nutri@ifpe.edu.br");
        responsavel.setPerfil(Perfil.NUTRICIONISTA);
        responsavel.setAtivo(true);

        when(produtoRepository.findById(id)).thenReturn(Optional.empty());

        ProdutoQuantidadeMinimaDTO request = new ProdutoQuantidadeMinimaDTO(new BigDecimal("5"));

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> produtoService.atualizarQuantidadeMinima(id, request, responsavel));
    }

    @Test
    void deveAtualizarControleValidadeMapeandoParaDTO() {
        UUID id = UUID.randomUUID();
        Produto produto = produtoComId(id, "Iogurte", "Frios", "un");
        Usuario responsavel = new Usuario();
        responsavel.setNome("Nutri");
        responsavel.setEmail("nutri@ifpe.edu.br");
        responsavel.setPerfil(Perfil.NUTRICIONISTA);
        responsavel.setAtivo(true);

        when(produtoRepository.findById(id)).thenReturn(Optional.of(produto));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(chamada -> chamada.getArgument(0));
        when(movimentacaoRepository.calcularSaldoTotal(id)).thenReturn(BigDecimal.ZERO);

        ProdutoControleValidadeDTO request = new ProdutoControleValidadeDTO(true);
        ProdutoResponseDTO resposta = produtoService.atualizarControleValidade(id, request, responsavel);

        assertThat(resposta.controlaValidade()).isTrue();
    }

    @Test
    void deveLancarNaoEncontradoQuandoAtualizarControleValidadeDeIdInexistente() {
        UUID id = UUID.randomUUID();
        Usuario responsavel = new Usuario();
        responsavel.setNome("Nutri");
        responsavel.setEmail("nutri@ifpe.edu.br");
        responsavel.setPerfil(Perfil.NUTRICIONISTA);
        responsavel.setAtivo(true);

        when(produtoRepository.findById(id)).thenReturn(Optional.empty());

        ProdutoControleValidadeDTO request = new ProdutoControleValidadeDTO(true);

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> produtoService.atualizarControleValidade(id, request, responsavel));
    }

    @Test
    void deveListarSaldoPorLocal() {
        UUID produtoId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId, "Arroz", "Secos", "kg");
        SaldoPorLocalDTO saldoDespensa = new SaldoPorLocalDTO(UUID.randomUUID(), "Despensa", new BigDecimal("6"));
        SaldoPorLocalDTO saldoCongelados = new SaldoPorLocalDTO(UUID.randomUUID(), "Congelados/Refrigerados", new BigDecimal("4"));

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.listarSaldoPorLocal(produtoId)).thenReturn(List.of(saldoDespensa, saldoCongelados));

        List<SaldoPorLocalDTO> resposta = produtoService.listarSaldoPorLocal(produtoId);

        assertThat(resposta).containsExactly(saldoDespensa, saldoCongelados);
    }

    @Test
    void deveLancarNaoEncontradoAoListarSaldoPorLocalDeProdutoInexistente() {
        UUID produtoId = UUID.randomUUID();
        when(produtoRepository.findById(produtoId)).thenReturn(Optional.empty());

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> produtoService.listarSaldoPorLocal(produtoId));
    }

    @Test
    void deveListarHistoricoMapeandoParaDTO() {
        UUID produtoId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId, "Arroz", "Secos", "kg");

        LocalArmazenamento local = new LocalArmazenamento();
        local.setId(UUID.randomUUID());
        local.setNome("Despensa");

        Usuario responsavel = new Usuario();
        responsavel.setNome("Cozinha");
        responsavel.setEmail("cozinha@ifpe.edu.br");
        responsavel.setPerfil(Perfil.COZINHA);
        responsavel.setAtivo(true);

        Movimentacao entrada = new Movimentacao();
        entrada.setId(UUID.randomUUID());
        entrada.setProduto(produto);
        entrada.setLocal(local);
        entrada.setTipo(TipoMovimentacao.ENTRADA);
        entrada.setOrigem(OrigemMovimentacao.EXTERNA);
        entrada.setQuantidade(new BigDecimal("10"));
        entrada.setValor(new BigDecimal("50.00"));
        entrada.setData(LocalDate.of(2026, 1, 10));
        entrada.setResponsavel(responsavel);

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.findByProdutoIdOrderByDataDesc(produtoId)).thenReturn(List.of(entrada));
        when(producaoInternaRepository.findByMovimentacaoIdIn(List.of(entrada.getId()))).thenReturn(List.of());

        List<MovimentacaoHistoricoDTO> resposta = produtoService.listarHistorico(produtoId);

        assertThat(resposta).hasSize(1);
        MovimentacaoHistoricoDTO dto = resposta.get(0);
        assertThat(dto.tipo()).isEqualTo(TipoMovimentacao.ENTRADA);
        assertThat(dto.quantidade()).isEqualByComparingTo("10");
        assertThat(dto.localNome()).isEqualTo("Despensa");
        assertThat(dto.origem()).isEqualTo(OrigemMovimentacao.EXTERNA);
        assertThat(dto.responsavelNome()).isEqualTo("Cozinha");
        assertThat(dto.responsavelEmail()).isEqualTo("cozinha@ifpe.edu.br");
        assertThat(dto.setorOrigem()).isNull();
        assertThat(dto.responsavelSetor()).isNull();
    }

    @Test
    void deveRetornarListaVaziaQuandoProdutoSemMovimentacoes() {
        UUID produtoId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId, "Arroz", "Secos", "kg");

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(movimentacaoRepository.findByProdutoIdOrderByDataDesc(produtoId)).thenReturn(List.of());
        when(producaoInternaRepository.findByMovimentacaoIdIn(List.of())).thenReturn(List.of());

        List<MovimentacaoHistoricoDTO> resposta = produtoService.listarHistorico(produtoId);

        assertThat(resposta).isEmpty();
    }

    @Test
    void deveLancarNaoEncontradoAoListarHistoricoDeProdutoInexistente() {
        UUID produtoId = UUID.randomUUID();
        when(produtoRepository.findById(produtoId)).thenReturn(Optional.empty());

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> produtoService.listarHistorico(produtoId));
    }
}
