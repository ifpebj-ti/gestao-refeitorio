package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoSaidaRequestDTO;
import br.ifpe.gestaorefeitorio.exception.LocalArmazenamentoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.SaldoInsuficienteException;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoSaida;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da US07/#84 na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class MovimentacaoServiceImplTest {

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @InjectMocks
    private MovimentacaoServiceImpl movimentacaoService;

    private Produto produtoComId(UUID id) {
        Produto produto = new Produto();
        produto.setId(id);
        produto.setNome("Arroz");
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        return produto;
    }

    private LocalArmazenamento localComId(UUID id) {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setId(id);
        local.setNome("Despensa");
        return local;
    }

    private Usuario responsavel() {
        Usuario usuario = new Usuario();
        usuario.setNome("Cozinha");
        usuario.setEmail("cozinha@ifpe.edu.br");
        usuario.setPerfil(Perfil.COZINHA);
        usuario.setAtivo(true);
        return usuario;
    }

    @Test
    void deveRegistrarEntradaEAumentarSaldo() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        LocalArmazenamento local = localComId(localId);
        MovimentacaoRequestDTO request = new MovimentacaoRequestDTO(
                produtoId, localId, new BigDecimal("10"), LocalDate.now(),
                OrigemMovimentacao.EXTERNA, new BigDecimal("50.00"));

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.of(local));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(chamada -> {
            Movimentacao salva = chamada.getArgument(0);
            salva.setId(UUID.randomUUID());
            return salva;
        });
        when(movimentacaoRepository.calcularSaldo(produtoId, localId)).thenReturn(new BigDecimal("10"));

        MovimentacaoResponseDTO resposta = movimentacaoService.registrarEntrada(request, responsavel());

        assertThat(resposta.tipo()).isEqualTo(TipoMovimentacao.ENTRADA);
        assertThat(resposta.produtoId()).isEqualTo(produtoId);
        assertThat(resposta.localId()).isEqualTo(localId);
        assertThat(resposta.quantidade()).isEqualByComparingTo("10");
        assertThat(resposta.saldoAtual()).isEqualByComparingTo("10");

        ArgumentCaptor<Movimentacao> captor = ArgumentCaptor.forClass(Movimentacao.class);
        verify(movimentacaoRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo(TipoMovimentacao.ENTRADA);
    }

    @Test
    void deveLancarProdutoNaoEncontradoQuandoProdutoInexistente() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        MovimentacaoRequestDTO request = new MovimentacaoRequestDTO(
                produtoId, localId, new BigDecimal("10"), LocalDate.now(),
                OrigemMovimentacao.EXTERNA, new BigDecimal("50.00"));

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.empty());

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> movimentacaoService.registrarEntrada(request, responsavel()));

        verifyNoInteractions(localArmazenamentoRepository, movimentacaoRepository);
    }

    @Test
    void deveLancarLocalNaoEncontradoQuandoLocalInexistente() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        MovimentacaoRequestDTO request = new MovimentacaoRequestDTO(
                produtoId, localId, new BigDecimal("10"), LocalDate.now(),
                OrigemMovimentacao.EXTERNA, new BigDecimal("50.00"));

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.empty());

        assertThrows(LocalArmazenamentoNaoEncontradoException.class,
                () -> movimentacaoService.registrarEntrada(request, responsavel()));

        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void deveRegistrarSaidaEReduzirSaldo() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        LocalArmazenamento local = localComId(localId);
        MovimentacaoSaidaRequestDTO request = new MovimentacaoSaidaRequestDTO(
                produtoId, localId, new BigDecimal("4"), LocalDate.now(), TipoSaida.CONSUMO);

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.of(local));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(chamada -> {
            Movimentacao salva = chamada.getArgument(0);
            salva.setId(UUID.randomUUID());
            return salva;
        });
        when(movimentacaoRepository.calcularSaldo(produtoId, localId)).thenReturn(new BigDecimal("6"));

        MovimentacaoResponseDTO resposta = movimentacaoService.registrarSaida(request, responsavel());

        assertThat(resposta.tipo()).isEqualTo(TipoMovimentacao.SAIDA);
        assertThat(resposta.tipoSaida()).isEqualTo(TipoSaida.CONSUMO);
        assertThat(resposta.quantidade()).isEqualByComparingTo("4");
        assertThat(resposta.saldoAtual()).isEqualByComparingTo("6");

        ArgumentCaptor<Movimentacao> captor = ArgumentCaptor.forClass(Movimentacao.class);
        verify(movimentacaoRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo(TipoMovimentacao.SAIDA);
        assertThat(captor.getValue().getTipoSaida()).isEqualTo(TipoSaida.CONSUMO);
    }

    @Test
    void deveLancarProdutoNaoEncontradoAoRegistrarSaidaEmProdutoInexistente() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        MovimentacaoSaidaRequestDTO request = new MovimentacaoSaidaRequestDTO(
                produtoId, localId, new BigDecimal("4"), LocalDate.now(), TipoSaida.CONSUMO);

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.empty());

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> movimentacaoService.registrarSaida(request, responsavel()));

        verifyNoInteractions(localArmazenamentoRepository, movimentacaoRepository);
    }

    @Test
    void deveLancarLocalNaoEncontradoAoRegistrarSaidaEmLocalInexistente() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        MovimentacaoSaidaRequestDTO request = new MovimentacaoSaidaRequestDTO(
                produtoId, localId, new BigDecimal("4"), LocalDate.now(), TipoSaida.PERDA);

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.empty());

        assertThrows(LocalArmazenamentoNaoEncontradoException.class,
                () -> movimentacaoService.registrarSaida(request, responsavel()));

        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void deveLancarSaldoInsuficienteQuandoSaidaMaiorQueSaldoDisponivel() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        LocalArmazenamento local = localComId(localId);
        MovimentacaoSaidaRequestDTO request = new MovimentacaoSaidaRequestDTO(
                produtoId, localId, new BigDecimal("5"), LocalDate.now(), TipoSaida.CONSUMO);

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.of(local));
        when(movimentacaoRepository.calcularSaldo(produtoId, localId)).thenReturn(new BigDecimal("2"));

        assertThrows(SaldoInsuficienteException.class,
                () -> movimentacaoService.registrarSaida(request, responsavel()));

        verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    void devePermitirSaidaQuandoQuantidadeIgualAoSaldoDisponivel() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        LocalArmazenamento local = localComId(localId);
        MovimentacaoSaidaRequestDTO request = new MovimentacaoSaidaRequestDTO(
                produtoId, localId, new BigDecimal("2"), LocalDate.now(), TipoSaida.CONSUMO);

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.of(local));
        when(movimentacaoRepository.calcularSaldo(produtoId, localId)).thenReturn(new BigDecimal("2"));
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(chamada -> {
            Movimentacao salva = chamada.getArgument(0);
            salva.setId(UUID.randomUUID());
            return salva;
        });

        MovimentacaoResponseDTO resposta = movimentacaoService.registrarSaida(request, responsavel());

        assertThat(resposta.tipo()).isEqualTo(TipoMovimentacao.SAIDA);
        verify(movimentacaoRepository).save(any(Movimentacao.class));
    }
}
