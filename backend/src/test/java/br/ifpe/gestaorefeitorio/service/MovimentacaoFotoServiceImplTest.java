package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoFotoResponseDTO;
import br.ifpe.gestaorefeitorio.exception.ArquivoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoFotoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.MovimentacaoFoto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoFotoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da US08/#88 na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class MovimentacaoFotoServiceImplTest {

    @Mock
    private MovimentacaoFotoRepository movimentacaoFotoRepository;

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @InjectMocks
    private MovimentacaoFotoServiceImpl movimentacaoFotoService;

    private Movimentacao movimentacaoComId(UUID id) {
        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setId(id);
        return movimentacao;
    }

    private Usuario responsavel() {
        Usuario usuario = new Usuario();
        usuario.setNome("Cozinha");
        usuario.setEmail("cozinha@ifpe.edu.br");
        usuario.setPerfil(Perfil.COZINHA);
        usuario.setAtivo(true);
        return usuario;
    }

    private MockMultipartFile arquivoValido() {
        return new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", "conteudo-fake".getBytes());
    }

    @Test
    void deveAnexarFotoMapeandoParaDTO() {
        UUID movimentacaoId = UUID.randomUUID();
        Movimentacao movimentacao = movimentacaoComId(movimentacaoId);

        when(movimentacaoRepository.findById(movimentacaoId)).thenReturn(Optional.of(movimentacao));
        when(movimentacaoFotoRepository.findByMovimentacaoId(movimentacaoId)).thenReturn(Optional.empty());
        when(movimentacaoFotoRepository.save(any(MovimentacaoFoto.class))).thenAnswer(chamada -> chamada.getArgument(0));

        MovimentacaoFotoResponseDTO resposta = movimentacaoFotoService.anexar(movimentacaoId, arquivoValido(), responsavel());

        assertThat(resposta.movimentacaoId()).isEqualTo(movimentacaoId);
        assertThat(resposta.contentType()).isEqualTo("image/jpeg");
        assertThat(resposta.tamanhoBytes()).isEqualTo(arquivoValido().getSize());
    }

    @Test
    void deveSubstituirFotoExistenteSemCriarDuplicata() {
        UUID movimentacaoId = UUID.randomUUID();
        Movimentacao movimentacao = movimentacaoComId(movimentacaoId);
        MovimentacaoFoto fotoExistente = new MovimentacaoFoto();
        fotoExistente.setId(UUID.randomUUID());
        fotoExistente.setMovimentacao(movimentacao);
        fotoExistente.setContentType("image/png");
        fotoExistente.setTamanhoBytes(10L);
        fotoExistente.setConteudo(new byte[] { 1, 2, 3 });

        when(movimentacaoRepository.findById(movimentacaoId)).thenReturn(Optional.of(movimentacao));
        when(movimentacaoFotoRepository.findByMovimentacaoId(movimentacaoId)).thenReturn(Optional.of(fotoExistente));
        when(movimentacaoFotoRepository.save(any(MovimentacaoFoto.class))).thenAnswer(chamada -> chamada.getArgument(0));

        MovimentacaoFotoResponseDTO resposta = movimentacaoFotoService.anexar(movimentacaoId, arquivoValido(), responsavel());

        assertThat(resposta.contentType()).isEqualTo("image/jpeg");

        ArgumentCaptor<MovimentacaoFoto> captor = ArgumentCaptor.forClass(MovimentacaoFoto.class);
        verify(movimentacaoFotoRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(fotoExistente.getId());
    }

    @Test
    void deveLancarArquivoInvalidoQuandoTipoNaoPermitido() {
        UUID movimentacaoId = UUID.randomUUID();
        Movimentacao movimentacao = movimentacaoComId(movimentacaoId);
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.pdf", "application/pdf", "conteudo".getBytes());

        when(movimentacaoRepository.findById(movimentacaoId)).thenReturn(Optional.of(movimentacao));

        assertThrows(ArquivoInvalidoException.class,
                () -> movimentacaoFotoService.anexar(movimentacaoId, arquivo, responsavel()));

        verify(movimentacaoFotoRepository, never()).save(any());
    }

    @Test
    void deveLancarArquivoInvalidoQuandoTamanhoExcedeLimite() {
        UUID movimentacaoId = UUID.randomUUID();
        Movimentacao movimentacao = movimentacaoComId(movimentacaoId);
        byte[] conteudoGrande = new byte[6 * 1024 * 1024]; // 6MB, acima do limite de 5MB
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", conteudoGrande);

        when(movimentacaoRepository.findById(movimentacaoId)).thenReturn(Optional.of(movimentacao));

        assertThrows(ArquivoInvalidoException.class,
                () -> movimentacaoFotoService.anexar(movimentacaoId, arquivo, responsavel()));

        verify(movimentacaoFotoRepository, never()).save(any());
    }

    @Test
    void deveLancarMovimentacaoNaoEncontradaAoAnexarEmIdInexistente() {
        UUID movimentacaoId = UUID.randomUUID();
        when(movimentacaoRepository.findById(movimentacaoId)).thenReturn(Optional.empty());

        assertThrows(MovimentacaoNaoEncontradaException.class,
                () -> movimentacaoFotoService.anexar(movimentacaoId, arquivoValido(), responsavel()));

        verifyNoInteractions(movimentacaoFotoRepository);
    }

    @Test
    void deveBuscarFotoComSucesso() {
        UUID movimentacaoId = UUID.randomUUID();
        MovimentacaoFoto foto = new MovimentacaoFoto();
        foto.setConteudo(new byte[] { 1, 2, 3 });
        foto.setContentType("image/jpeg");

        when(movimentacaoRepository.existsById(movimentacaoId)).thenReturn(true);
        when(movimentacaoFotoRepository.findByMovimentacaoId(movimentacaoId)).thenReturn(Optional.of(foto));

        MovimentacaoFoto resultado = movimentacaoFotoService.buscarPorMovimentacao(movimentacaoId);

        assertThat(resultado.getContentType()).isEqualTo("image/jpeg");
    }

    @Test
    void deveLancarFotoNaoEncontradaQuandoMovimentacaoExisteSemFoto() {
        UUID movimentacaoId = UUID.randomUUID();
        when(movimentacaoRepository.existsById(movimentacaoId)).thenReturn(true);
        when(movimentacaoFotoRepository.findByMovimentacaoId(movimentacaoId)).thenReturn(Optional.empty());

        assertThrows(MovimentacaoFotoNaoEncontradaException.class,
                () -> movimentacaoFotoService.buscarPorMovimentacao(movimentacaoId));
    }

    @Test
    void deveLancarMovimentacaoNaoEncontradaAoBuscarEmIdInexistente() {
        UUID movimentacaoId = UUID.randomUUID();
        when(movimentacaoRepository.existsById(movimentacaoId)).thenReturn(false);

        assertThrows(MovimentacaoNaoEncontradaException.class,
                () -> movimentacaoFotoService.buscarPorMovimentacao(movimentacaoId));

        verifyNoInteractions(movimentacaoFotoRepository);
    }
}
