package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.RemetenteRequestDTO;
import br.ifpe.gestaorefeitorio.dto.RemetenteResponseDTO;
import br.ifpe.gestaorefeitorio.exception.RemetenteJaCadastradoException;
import br.ifpe.gestaorefeitorio.exception.RemetenteNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da #286 (US26) na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class RemetenteServiceImplTest {

    @Mock
    private RemetenteRepository remetenteRepository;

    @InjectMocks
    private RemetenteServiceImpl remetenteService;

    private Remetente remetenteComId(UUID id, String nome, boolean ativo) {
        Remetente remetente = new Remetente();
        remetente.setId(id);
        remetente.setNome(nome);
        remetente.setAtivo(ativo);
        return remetente;
    }

    private void salvarDevolvendoArgumento() {
        when(remetenteRepository.save(any(Remetente.class))).thenAnswer(chamada -> {
            Remetente salvo = chamada.getArgument(0);
            if (salvo.getId() == null) {
                salvo.setId(UUID.randomUUID());
            }
            return salvo;
        });
    }

    @Test
    void deveCadastrarComNomeNormalizadoDocumentoSoComDigitosEAtivo() {
        when(remetenteRepository.findByNomeIgnoreCase("Agroindústria")).thenReturn(Optional.empty());
        salvarDevolvendoArgumento();

        RemetenteResponseDTO resposta = remetenteService.cadastrar(
                new RemetenteRequestDTO("  Agroindústria  ", "12.345.678/0001-95", " (81) 99999-0000 "));

        assertThat(resposta.nome()).isEqualTo("Agroindústria");
        assertThat(resposta.documento()).isEqualTo("12345678000195");
        assertThat(resposta.contato()).isEqualTo("(81) 99999-0000");
        assertThat(resposta.ativo()).isTrue();

        ArgumentCaptor<Remetente> captor = ArgumentCaptor.forClass(Remetente.class);
        verify(remetenteRepository).save(captor.capture());
        assertThat(captor.getValue().isAtivo()).isTrue();
    }

    @Test
    void deveSalvarDocumentoEContatoVaziosComoNulos() {
        when(remetenteRepository.findByNomeIgnoreCase("Doador")).thenReturn(Optional.empty());
        salvarDevolvendoArgumento();

        RemetenteResponseDTO resposta = remetenteService.cadastrar(new RemetenteRequestDTO("Doador", "", "  "));

        assertThat(resposta.documento()).isNull();
        assertThat(resposta.contato()).isNull();
    }

    @Test
    void deveLancarJaCadastradoQuandoNomeDuplicadoNoCadastro() {
        when(remetenteRepository.findByNomeIgnoreCase("Fornecedor X"))
                .thenReturn(Optional.of(remetenteComId(UUID.randomUUID(), "fornecedor x", true)));

        assertThrows(RemetenteJaCadastradoException.class,
                () -> remetenteService.cadastrar(new RemetenteRequestDTO(" Fornecedor X ", null, null)));

        verify(remetenteRepository, never()).save(any());
    }

    @Test
    void deveListarTodosQuandoSemFiltro() {
        when(remetenteRepository.findAll(any(Sort.class))).thenReturn(List.of(
                remetenteComId(UUID.randomUUID(), "A", true),
                remetenteComId(UUID.randomUUID(), "B", false)));

        assertThat(remetenteService.listar(null)).hasSize(2);

        verify(remetenteRepository, never()).findByAtivo(anyBoolean(), any());
    }

    @Test
    void deveListarFiltrandoPorAtivo() {
        when(remetenteRepository.findByAtivo(eq(false), any(Sort.class)))
                .thenReturn(List.of(remetenteComId(UUID.randomUUID(), "Inativo", false)));

        List<RemetenteResponseDTO> resposta = remetenteService.listar(false);

        assertThat(resposta).hasSize(1);
        assertThat(resposta.get(0).ativo()).isFalse();
    }

    @Test
    void deveLancarNaoEncontradoQuandoBuscarIdInexistente() {
        UUID id = UUID.randomUUID();
        when(remetenteRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(RemetenteNaoEncontradoException.class, () -> remetenteService.buscarPorId(id));
    }

    @Test
    void deveEditarSubstituindoTodosOsCampos() {
        UUID id = UUID.randomUUID();
        Remetente remetente = remetenteComId(id, "Antigo", true);
        remetente.setDocumento("12345678909");
        remetente.setContato("contato antigo");
        when(remetenteRepository.findById(id)).thenReturn(Optional.of(remetente));
        when(remetenteRepository.existsByNomeIgnoreCaseAndIdNot("Novo", id)).thenReturn(false);
        salvarDevolvendoArgumento();

        RemetenteResponseDTO resposta = remetenteService.editar(id, new RemetenteRequestDTO(" Novo ", null, null));

        assertThat(resposta.nome()).isEqualTo("Novo");
        assertThat(resposta.documento()).isNull();
        assertThat(resposta.contato()).isNull();
    }

    @Test
    void deveLancarJaCadastradoQuandoNomeDuplicadoNaEdicao() {
        UUID id = UUID.randomUUID();
        when(remetenteRepository.findById(id)).thenReturn(Optional.of(remetenteComId(id, "Atual", true)));
        when(remetenteRepository.existsByNomeIgnoreCaseAndIdNot("Outro", id)).thenReturn(true);

        assertThrows(RemetenteJaCadastradoException.class,
                () -> remetenteService.editar(id, new RemetenteRequestDTO("Outro", null, null)));

        verify(remetenteRepository, never()).save(any());
    }

    @Test
    void deveLancarNaoEncontradoQuandoEditarIdInexistente() {
        UUID id = UUID.randomUUID();
        when(remetenteRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(RemetenteNaoEncontradoException.class,
                () -> remetenteService.editar(id, new RemetenteRequestDTO("Nome", null, null)));

        verify(remetenteRepository, never()).save(any());
    }

    @Test
    void deveInativarEReativar() {
        UUID id = UUID.randomUUID();
        Remetente remetente = remetenteComId(id, "Setor de Agricultura", true);
        when(remetenteRepository.findById(id)).thenReturn(Optional.of(remetente));
        salvarDevolvendoArgumento();

        assertThat(remetenteService.inativar(id).ativo()).isFalse();
        assertThat(remetenteService.reativar(id).ativo()).isTrue();
    }

    @Test
    void deveLancarNaoEncontradoQuandoInativarIdInexistente() {
        UUID id = UUID.randomUUID();
        when(remetenteRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(RemetenteNaoEncontradoException.class, () -> remetenteService.inativar(id));

        verify(remetenteRepository, never()).save(any());
    }
}
