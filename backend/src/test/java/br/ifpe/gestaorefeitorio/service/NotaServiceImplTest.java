package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoJaVinculadaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEntradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacoesRepetidasException;
import br.ifpe.gestaorefeitorio.exception.NotaJaCadastradaException;
import br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.RemetenteInativoException;
import br.ifpe.gestaorefeitorio.exception.RemetenteNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.NotaRepository;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da #287 (US27) na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class NotaServiceImplTest {

    @Mock
    private NotaRepository notaRepository;

    @Mock
    private RemetenteRepository remetenteRepository;

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @InjectMocks
    private NotaServiceImpl notaService;

    private Usuario nutricionista;
    private Remetente remetente;

    @BeforeEach
    void setUp() {
        nutricionista = new Usuario();
        nutricionista.setId(UUID.randomUUID());
        nutricionista.setNome("Nutri");
        nutricionista.setEmail("nutri@ifpe.edu.br");
        nutricionista.setPerfil(Perfil.NUTRICIONISTA);

        remetente = new Remetente();
        remetente.setId(UUID.randomUUID());
        remetente.setNome("Agroindústria");
        remetente.setAtivo(true);
    }

    private Movimentacao movimentacao(TipoMovimentacao tipo) {
        Produto produto = new Produto();
        produto.setId(UUID.randomUUID());
        produto.setNome("Arroz");
        produto.setUnidadeMedida("kg");

        LocalArmazenamento local = new LocalArmazenamento();
        local.setId(UUID.randomUUID());
        local.setNome("Despensa");

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setId(UUID.randomUUID());
        movimentacao.setTipo(tipo);
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setQuantidade(new BigDecimal("10"));
        movimentacao.setData(LocalDate.now());
        movimentacao.setLote("L-01");
        return movimentacao;
    }

    private NotaRequestDTO request(String numero, List<UUID> movimentacaoIds) {
        return new NotaRequestDTO(numero, LocalDate.now(), remetente.getId(), movimentacaoIds, null);
    }

    @Test
    void deveRegistrarNotaPendenteComEntradasEUsuarioAutenticado() {
        Movimentacao entrada = movimentacao(TipoMovimentacao.ENTRADA);
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(notaRepository.existsByRemetenteIdAndNumero(remetente.getId(), "NF-1")).thenReturn(false);
        when(movimentacaoRepository.findById(entrada.getId())).thenReturn(Optional.of(entrada));
        when(notaRepository.existsByMovimentacaoId(entrada.getId())).thenReturn(false);
        when(notaRepository.save(any(Nota.class))).thenAnswer(chamada -> {
            Nota salva = chamada.getArgument(0);
            salva.setId(UUID.randomUUID());
            return salva;
        });

        NotaResponseDTO resposta = notaService.registrar(request("  NF-1 ", List.of(entrada.getId())), nutricionista);

        assertThat(resposta.numero()).isEqualTo("NF-1");
        assertThat(resposta.status()).isEqualTo(StatusNota.PENDENTE);
        assertThat(resposta.remetente().nome()).isEqualTo("Agroindústria");
        assertThat(resposta.registradoPor().email()).isEqualTo("nutri@ifpe.edu.br");
        assertThat(resposta.entradas()).hasSize(1);
        assertThat(resposta.entradas().get(0).lote()).isEqualTo("L-01");
        assertThat(resposta.entradas().get(0).unidadeMedida()).isEqualTo("kg");

        ArgumentCaptor<Nota> captor = ArgumentCaptor.forClass(Nota.class);
        verify(notaRepository).save(captor.capture());
        assertThat(captor.getValue().getRegistradoPor()).isSameAs(nutricionista);
    }

    @Test
    void deveLancarRepetidasQuandoIdsDuplicados() {
        UUID id = UUID.randomUUID();

        assertThrows(MovimentacoesRepetidasException.class,
                () -> notaService.registrar(request("NF-1", List.of(id, id)), nutricionista));

        verifyNoInteractions(remetenteRepository, movimentacaoRepository);
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarNaoEncontradoQuandoRemetenteInexistente() {
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.empty());

        assertThrows(RemetenteNaoEncontradoException.class,
                () -> notaService.registrar(request("NF-1", List.of(UUID.randomUUID())), nutricionista));

        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarInativoQuandoRemetenteInativo() {
        remetente.setAtivo(false);
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));

        assertThrows(RemetenteInativoException.class,
                () -> notaService.registrar(request("NF-1", List.of(UUID.randomUUID())), nutricionista));

        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarJaCadastradaQuandoNumeroRepetidoNoRemetente() {
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(notaRepository.existsByRemetenteIdAndNumero(remetente.getId(), "NF-1")).thenReturn(true);

        assertThrows(NotaJaCadastradaException.class,
                () -> notaService.registrar(request("NF-1", List.of(UUID.randomUUID())), nutricionista));

        verifyNoInteractions(movimentacaoRepository);
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarNaoEncontradaQuandoMovimentacaoInexistente() {
        UUID id = UUID.randomUUID();
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(movimentacaoRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(MovimentacaoNaoEncontradaException.class,
                () -> notaService.registrar(request("NF-1", List.of(id)), nutricionista));

        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarNaoEntradaQuandoMovimentacaoDeSaida() {
        Movimentacao saida = movimentacao(TipoMovimentacao.SAIDA);
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(movimentacaoRepository.findById(saida.getId())).thenReturn(Optional.of(saida));

        assertThrows(MovimentacaoNaoEntradaException.class,
                () -> notaService.registrar(request("NF-1", List.of(saida.getId())), nutricionista));

        verify(notaRepository, never()).save(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void deveListarEntradasDisponiveisComFornecedor() {
        Movimentacao entrada = movimentacao(TipoMovimentacao.ENTRADA);
        entrada.setFornecedor("Cooperativa Agro");
        when(movimentacaoRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(entrada));

        List<NotaEntradaDTO> resposta = notaService.listarEntradasDisponiveis(null, null, null, "  ");

        assertThat(resposta).hasSize(1);
        assertThat(resposta.get(0).movimentacaoId()).isEqualTo(entrada.getId());
        assertThat(resposta.get(0).fornecedor()).isEqualTo("Cooperativa Agro");
        assertThat(resposta.get(0).unidadeMedida()).isEqualTo("kg");
    }

    @Test
    void deveMontarPadraoParcialEscapandoCuringasDoLike() {
        assertThat(NotaServiceImpl.padraoBuscaParcial(" 50%_a ")).isEqualTo("%50\\%\\_a%");
        assertThat(NotaServiceImpl.padraoBuscaParcial("c:\\x")).isEqualTo("%c:\\\\x%");
        assertThat(NotaServiceImpl.padraoBuscaParcial("   ")).isNull();
        assertThat(NotaServiceImpl.padraoBuscaParcial(null)).isNull();
    }

    @Test
    @SuppressWarnings("unchecked")
    void deveLancarPeriodoInvalidoQuandoDataInicioDepoisDeDataFim() {
        LocalDate inicio = LocalDate.of(2026, 2, 1);
        LocalDate fim = LocalDate.of(2026, 1, 1);

        assertThrows(PeriodoInvalidoException.class,
                () -> notaService.listarEntradasDisponiveis(inicio, fim, null, null));

        verify(movimentacaoRepository, never()).findAll(any(Specification.class), any(Sort.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void deveAceitarPeriodoComApenasUmaDasDatas() {
        when(movimentacaoRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of());

        assertThat(notaService.listarEntradasDisponiveis(LocalDate.of(2026, 2, 1), null, null, null)).isEmpty();
    }

    @Test
    void deveLancarJaVinculadaQuandoEntradaPertenceAOutraNota() {
        Movimentacao entrada = movimentacao(TipoMovimentacao.ENTRADA);
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(movimentacaoRepository.findById(entrada.getId())).thenReturn(Optional.of(entrada));
        when(notaRepository.existsByMovimentacaoId(entrada.getId())).thenReturn(true);

        assertThrows(MovimentacaoJaVinculadaException.class,
                () -> notaService.registrar(request("NF-1", List.of(entrada.getId())), nutricionista));

        verify(notaRepository, never()).save(any());
    }
}
