package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaEntradaDTO;
import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoJaVinculadaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEntradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacoesRepetidasException;
import br.ifpe.gestaorefeitorio.exception.NotaJaCadastradaException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoPendenteException;
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

    // ---- editar (#289) ----

    private Nota notaExistente(StatusNota status, Movimentacao... entradas) {
        Nota nota = new Nota();
        nota.setId(UUID.randomUUID());
        nota.setNumero("NF-1");
        nota.setData(LocalDate.now());
        nota.setStatus(status);
        nota.setRemetente(remetente);
        nota.setRegistradoPor(nutricionista);
        nota.substituirMovimentacoes(List.of(entradas));
        return nota;
    }

    private Usuario outroUsuario() {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setNome("Outra Nutri");
        usuario.setEmail("outra@ifpe.edu.br");
        usuario.setPerfil(Perfil.NUTRICIONISTA);
        return usuario;
    }

    @Test
    void deveEditarNotaPendenteSubstituindoEntradasESemTrocarRegistradoPor() {
        Movimentacao mantida = movimentacao(TipoMovimentacao.ENTRADA);
        Movimentacao retirada = movimentacao(TipoMovimentacao.ENTRADA);
        Movimentacao nova = movimentacao(TipoMovimentacao.ENTRADA);
        Nota nota = notaExistente(StatusNota.PENDENTE, mantida, retirada);

        when(notaRepository.findById(nota.getId())).thenReturn(Optional.of(nota));
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(notaRepository.existsByRemetenteIdAndNumeroAndIdNot(remetente.getId(), "NF-1", nota.getId()))
                .thenReturn(false);
        when(movimentacaoRepository.findById(mantida.getId())).thenReturn(Optional.of(mantida));
        when(movimentacaoRepository.findById(nova.getId())).thenReturn(Optional.of(nova));
        when(notaRepository.existsByMovimentacaoIdAndNotaIdNot(any(), eq(nota.getId()))).thenReturn(false);
        when(notaRepository.save(any(Nota.class))).thenAnswer(chamada -> chamada.getArgument(0));

        NotaResponseDTO resposta = notaService.editar(nota.getId(),
                new NotaRequestDTO(" NF-1 ", LocalDate.now(), remetente.getId(),
                        List.of(mantida.getId(), nova.getId()), "corrigida"),
                outroUsuario());

        assertThat(resposta.numero()).isEqualTo("NF-1");
        assertThat(resposta.observacoes()).isEqualTo("corrigida");
        assertThat(resposta.entradas()).extracting(e -> e.movimentacaoId())
                .containsExactly(mantida.getId(), nova.getId());
        assertThat(resposta.registradoPor().email()).isEqualTo("nutri@ifpe.edu.br");
        assertThat(resposta.status()).isEqualTo(StatusNota.PENDENTE);
        // Na edição, a checagem de vínculo do registro (que não ignora a própria nota) não é usada.
        verify(notaRepository, never()).existsByMovimentacaoId(any());
        verify(notaRepository, never()).existsByRemetenteIdAndNumero(any(), any());
    }

    @Test
    void deveLancarNaoEncontradaQuandoEditarNotaInexistente() {
        UUID id = UUID.randomUUID();
        when(notaRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotaNaoEncontradaException.class,
                () -> notaService.editar(id, request("NF-1", List.of(UUID.randomUUID())), nutricionista));

        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarNaoPendenteQuandoEditarNotaValidadaOuCancelada() {
        for (StatusNota status : List.of(StatusNota.VALIDADA, StatusNota.CANCELADA)) {
            Nota nota = notaExistente(status);
            when(notaRepository.findById(nota.getId())).thenReturn(Optional.of(nota));

            assertThrows(NotaNaoPendenteException.class,
                    () -> notaService.editar(nota.getId(), request("NF-2", List.of(UUID.randomUUID())), nutricionista));
        }

        verifyNoInteractions(remetenteRepository, movimentacaoRepository);
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarJaCadastradaQuandoEditarParaNumeroDeOutraNotaDoRemetente() {
        Nota nota = notaExistente(StatusNota.PENDENTE);
        when(notaRepository.findById(nota.getId())).thenReturn(Optional.of(nota));
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(notaRepository.existsByRemetenteIdAndNumeroAndIdNot(remetente.getId(), "NF-9", nota.getId()))
                .thenReturn(true);

        assertThrows(NotaJaCadastradaException.class,
                () -> notaService.editar(nota.getId(), request("NF-9", List.of(UUID.randomUUID())), nutricionista));

        assertThat(nota.getNumero()).isEqualTo("NF-1");
        verify(notaRepository, never()).save(any());
    }

    @Test
    void deveLancarJaVinculadaQuandoEditarComEntradaDeOutraNota() {
        Movimentacao deOutra = movimentacao(TipoMovimentacao.ENTRADA);
        Nota nota = notaExistente(StatusNota.PENDENTE);
        when(notaRepository.findById(nota.getId())).thenReturn(Optional.of(nota));
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(movimentacaoRepository.findById(deOutra.getId())).thenReturn(Optional.of(deOutra));
        when(notaRepository.existsByMovimentacaoIdAndNotaIdNot(deOutra.getId(), nota.getId())).thenReturn(true);

        assertThrows(MovimentacaoJaVinculadaException.class,
                () -> notaService.editar(nota.getId(), request("NF-1", List.of(deOutra.getId())), nutricionista));

        verify(notaRepository, never()).save(any());
    }

    @Test
    void devePermitirManterRemetenteAtualMesmoInativo() {
        remetente.setAtivo(false);
        Movimentacao entrada = movimentacao(TipoMovimentacao.ENTRADA);
        Nota nota = notaExistente(StatusNota.PENDENTE, entrada);
        when(notaRepository.findById(nota.getId())).thenReturn(Optional.of(nota));
        when(remetenteRepository.findById(remetente.getId())).thenReturn(Optional.of(remetente));
        when(movimentacaoRepository.findById(entrada.getId())).thenReturn(Optional.of(entrada));
        when(notaRepository.save(any(Nota.class))).thenAnswer(chamada -> chamada.getArgument(0));

        NotaResponseDTO resposta = notaService.editar(nota.getId(),
                request("NF-1", List.of(entrada.getId())), nutricionista);

        assertThat(resposta.remetente().id()).isEqualTo(remetente.getId());
    }

    @Test
    void deveLancarInativoQuandoEditarTrocandoParaRemetenteInativo() {
        Nota nota = notaExistente(StatusNota.PENDENTE);
        Remetente inativo = new Remetente();
        inativo.setId(UUID.randomUUID());
        inativo.setNome("Inativo");
        inativo.setAtivo(false);
        when(notaRepository.findById(nota.getId())).thenReturn(Optional.of(nota));
        when(remetenteRepository.findById(inativo.getId())).thenReturn(Optional.of(inativo));

        assertThrows(RemetenteInativoException.class, () -> notaService.editar(nota.getId(),
                new NotaRequestDTO("NF-1", LocalDate.now(), inativo.getId(), List.of(UUID.randomUUID()), null),
                nutricionista));

        verify(notaRepository, never()).save(any());
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
