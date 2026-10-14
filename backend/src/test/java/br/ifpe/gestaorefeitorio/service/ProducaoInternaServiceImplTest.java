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
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProducaoInternaRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.SetorProdutivoRepository;
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
 * Cobre os critérios de aceite da US13/#142 na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class ProducaoInternaServiceImplTest {

    @Mock
    private ProducaoInternaRepository producaoInternaRepository;

    @Mock
    private SetorProdutivoRepository setorProdutivoRepository;

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @InjectMocks
    private ProducaoInternaServiceImpl producaoInternaService;

    private Produto produtoComId(UUID id) {
        Produto produto = new Produto();
        produto.setId(id);
        produto.setNome("Alface");
        produto.setCategoria("Hortaliças");
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

    private void mockearSalvamentos() {
        when(movimentacaoRepository.save(any(Movimentacao.class))).thenAnswer(chamada -> {
            Movimentacao salva = chamada.getArgument(0);
            salva.setId(UUID.randomUUID());
            return salva;
        });
        when(producaoInternaRepository.save(any(ProducaoInterna.class))).thenAnswer(chamada -> {
            ProducaoInterna salva = chamada.getArgument(0);
            salva.setId(UUID.randomUUID());
            return salva;
        });
    }

    @Test
    void deveRegistrarRecebimentoCriandoMovimentacaoEProducaoInterna() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        LocalArmazenamento local = localComId(localId);
        ProducaoInternaRequestDTO request = new ProducaoInternaRequestDTO(
                produtoId, localId, new BigDecimal("5"), LocalDate.now(), "Horta", "João da Horta");

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.of(local));
        when(setorProdutivoRepository.findByNomeIgnoreCase("Horta")).thenReturn(Optional.empty());
        when(setorProdutivoRepository.save(any(SetorProdutivo.class))).thenAnswer(chamada -> {
            SetorProdutivo salvo = chamada.getArgument(0);
            salvo.setId(UUID.randomUUID());
            return salvo;
        });
        mockearSalvamentos();
        when(movimentacaoRepository.calcularSaldo(produtoId, localId)).thenReturn(new BigDecimal("5"));

        ProducaoInternaResponseDTO resposta = producaoInternaService.registrarRecebimento(request, responsavel());

        assertThat(resposta.produtoId()).isEqualTo(produtoId);
        assertThat(resposta.localId()).isEqualTo(localId);
        assertThat(resposta.quantidade()).isEqualByComparingTo("5");
        assertThat(resposta.setorOrigem()).isEqualTo("Horta");
        assertThat(resposta.responsavelSetor()).isEqualTo("João da Horta");
        assertThat(resposta.saldoAtual()).isEqualByComparingTo("5");

        ArgumentCaptor<Movimentacao> captorMovimentacao = ArgumentCaptor.forClass(Movimentacao.class);
        verify(movimentacaoRepository).save(captorMovimentacao.capture());
        assertThat(captorMovimentacao.getValue().getTipo()).isEqualTo(TipoMovimentacao.ENTRADA);
        assertThat(captorMovimentacao.getValue().getOrigem()).isEqualTo(OrigemMovimentacao.INTERNA);

        verify(setorProdutivoRepository).save(any(SetorProdutivo.class));
        verify(producaoInternaRepository).save(any(ProducaoInterna.class));
    }

    @Test
    void deveReutilizarSetorExistenteQuandoNomeJaCadastrado() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        LocalArmazenamento local = localComId(localId);
        SetorProdutivo setorExistente = new SetorProdutivo();
        setorExistente.setId(UUID.randomUUID());
        setorExistente.setNome("Agroindústria - Laticínios");
        ProducaoInternaRequestDTO request = new ProducaoInternaRequestDTO(
                produtoId, localId, new BigDecimal("3"), LocalDate.now(), "agroindústria - laticínios", "Maria");

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.of(local));
        when(setorProdutivoRepository.findByNomeIgnoreCase("agroindústria - laticínios"))
                .thenReturn(Optional.of(setorExistente));
        mockearSalvamentos();
        when(movimentacaoRepository.calcularSaldo(produtoId, localId)).thenReturn(new BigDecimal("3"));

        ProducaoInternaResponseDTO resposta = producaoInternaService.registrarRecebimento(request, responsavel());

        assertThat(resposta.setorOrigem()).isEqualTo("Agroindústria - Laticínios");
        verify(setorProdutivoRepository, never()).save(any());
    }

    @Test
    void deveLancarProdutoNaoEncontradoQuandoProdutoInexistente() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        ProducaoInternaRequestDTO request = new ProducaoInternaRequestDTO(
                produtoId, localId, new BigDecimal("5"), LocalDate.now(), "Horta", "João");

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.empty());

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> producaoInternaService.registrarRecebimento(request, responsavel()));

        verifyNoInteractions(localArmazenamentoRepository, movimentacaoRepository,
                setorProdutivoRepository, producaoInternaRepository);
    }

    @Test
    void deveLancarLocalNaoEncontradoQuandoLocalInexistente() {
        UUID produtoId = UUID.randomUUID();
        UUID localId = UUID.randomUUID();
        Produto produto = produtoComId(produtoId);
        ProducaoInternaRequestDTO request = new ProducaoInternaRequestDTO(
                produtoId, localId, new BigDecimal("5"), LocalDate.now(), "Horta", "João");

        when(produtoRepository.findById(produtoId)).thenReturn(Optional.of(produto));
        when(localArmazenamentoRepository.findById(localId)).thenReturn(Optional.empty());

        assertThrows(LocalArmazenamentoNaoEncontradoException.class,
                () -> producaoInternaService.registrarRecebimento(request, responsavel()));

        verifyNoInteractions(movimentacaoRepository, setorProdutivoRepository, producaoInternaRepository);
    }
}
