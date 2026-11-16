package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaDocumentoResponseDTO;
import br.ifpe.gestaorefeitorio.exception.ArquivoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.NotaDocumentoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoPendenteException;
import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.NotaDocumento;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.repository.NotaDocumentoRepository;
import br.ifpe.gestaorefeitorio.repository.NotaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
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
 * Anexo do documento da nota (US28/#290): tipos, tamanho, assinatura, substituição e status da nota.
 */
@ExtendWith(MockitoExtension.class)
class NotaDocumentoServiceImplTest {

    @Mock
    private NotaDocumentoRepository notaDocumentoRepository;

    @Mock
    private NotaRepository notaRepository;

    @InjectMocks
    private NotaDocumentoServiceImpl service;

    private final Usuario nutricionista = usuario();

    private static Usuario usuario() {
        Usuario usuario = new Usuario();
        usuario.setEmail("nutri@ifpe.edu.br");
        return usuario;
    }

    private Nota nota(UUID id, StatusNota status) {
        Nota nota = new Nota();
        nota.setId(id);
        nota.setStatus(status);
        when(notaRepository.findById(id)).thenReturn(Optional.of(nota));
        return nota;
    }

    private MockMultipartFile arquivo(String contentType, byte[] conteudo) {
        return new MockMultipartFile("arquivo", "../../etc/nota-original.pdf", contentType, conteudo);
    }

    @Test
    void deveAnexarPdfGravandoOTipoDetectadoESemUsarONomeDoArquivo() {
        UUID id = UUID.randomUUID();
        Nota nota = nota(id, StatusNota.PENDENTE);
        when(notaDocumentoRepository.findByNotaId(id)).thenReturn(Optional.empty());
        when(notaDocumentoRepository.save(any(NotaDocumento.class))).thenAnswer(chamada -> chamada.getArgument(0));

        NotaDocumentoResponseDTO resposta = service.anexar(id,
                arquivo("application/pdf", AssinaturaDocumentoTest.PDF), nutricionista);

        ArgumentCaptor<NotaDocumento> captor = ArgumentCaptor.forClass(NotaDocumento.class);
        verify(notaDocumentoRepository).save(captor.capture());
        NotaDocumento salvo = captor.getValue();
        assertThat(salvo.getNota()).isSameAs(nota);
        assertThat(salvo.getContentType()).isEqualTo("application/pdf");
        assertThat(salvo.getConteudo()).isEqualTo(AssinaturaDocumentoTest.PDF);
        assertThat(salvo.getTamanhoBytes()).isEqualTo(AssinaturaDocumentoTest.PDF.length);
        assertThat(resposta.notaId()).isEqualTo(id);
        assertThat(resposta.contentType()).isEqualTo("application/pdf");
    }

    @Test
    void deveSubstituirODocumentoDeNotaPendente() {
        UUID id = UUID.randomUUID();
        Nota nota = nota(id, StatusNota.PENDENTE);
        NotaDocumento existente = new NotaDocumento();
        existente.setNota(nota);
        existente.setContentType("application/pdf");
        existente.setConteudo(AssinaturaDocumentoTest.PDF);
        when(notaDocumentoRepository.findByNotaId(id)).thenReturn(Optional.of(existente));
        when(notaDocumentoRepository.save(existente)).thenReturn(existente);

        service.anexar(id, arquivo("image/png", AssinaturaDocumentoTest.PNG), nutricionista);

        assertThat(existente.getContentType()).isEqualTo("image/png");
        assertThat(existente.getConteudo()).isEqualTo(AssinaturaDocumentoTest.PNG);
        verify(notaDocumentoRepository).save(existente);
    }

    @ParameterizedTest
    @EnumSource(value = StatusNota.class, names = { "VALIDADA", "CANCELADA" })
    void deveRecusarAnexoEmNotaQueNaoEstaPendente(StatusNota status) {
        UUID id = UUID.randomUUID();
        nota(id, status);

        assertThrows(NotaNaoPendenteException.class, () -> service.anexar(id,
                arquivo("application/pdf", AssinaturaDocumentoTest.PDF), nutricionista));
        verify(notaDocumentoRepository, never()).save(any());
    }

    @Test
    void deveLancarNotaNaoEncontradaAoAnexarOuBuscar() {
        UUID id = UUID.randomUUID();
        when(notaRepository.findById(id)).thenReturn(Optional.empty());
        when(notaRepository.existsById(id)).thenReturn(false);

        assertThrows(NotaNaoEncontradaException.class, () -> service.anexar(id,
                arquivo("application/pdf", AssinaturaDocumentoTest.PDF), nutricionista));
        assertThrows(NotaNaoEncontradaException.class, () -> service.buscarPorNota(id));
    }

    @Test
    void deveRecusarTipoNaoPermitido() {
        UUID id = UUID.randomUUID();
        nota(id, StatusNota.PENDENTE);

        assertThrows(ArquivoInvalidoException.class, () -> service.anexar(id,
                arquivo("text/plain", "texto".getBytes()), nutricionista));
    }

    @Test
    void deveRecusarArquivoVazio() {
        UUID id = UUID.randomUUID();
        nota(id, StatusNota.PENDENTE);

        assertThrows(ArquivoInvalidoException.class, () -> service.anexar(id,
                arquivo("application/pdf", new byte[0]), nutricionista));
    }

    @Test
    void deveRecusarArquivoAcimaDe5MB() {
        UUID id = UUID.randomUUID();
        nota(id, StatusNota.PENDENTE);
        byte[] grande = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(AssinaturaDocumentoTest.PDF, 0, grande, 0, AssinaturaDocumentoTest.PDF.length);

        assertThrows(ArquivoInvalidoException.class, () -> service.anexar(id,
                arquivo("application/pdf", grande), nutricionista));
    }

    @Test
    void deveRecusarConteudoQueNaoBateComOTipoDeclarado() {
        UUID id = UUID.randomUUID();
        nota(id, StatusNota.PENDENTE);

        assertThrows(ArquivoInvalidoException.class, () -> service.anexar(id,
                arquivo("application/pdf", AssinaturaDocumentoTest.PNG), nutricionista));
        assertThrows(ArquivoInvalidoException.class, () -> service.anexar(id,
                arquivo("image/png", "não é imagem".getBytes()), nutricionista));
        verify(notaDocumentoRepository, never()).save(any());
    }

    @Test
    void deveDevolverODocumentoOu404QuandoANotaNaoTemDocumento() {
        UUID comDocumento = UUID.randomUUID();
        UUID semDocumento = UUID.randomUUID();
        NotaDocumento documento = new NotaDocumento();
        when(notaRepository.existsById(comDocumento)).thenReturn(true);
        when(notaRepository.existsById(semDocumento)).thenReturn(true);
        when(notaDocumentoRepository.findByNotaId(comDocumento)).thenReturn(Optional.of(documento));
        when(notaDocumentoRepository.findByNotaId(semDocumento)).thenReturn(Optional.empty());

        assertThat(service.buscarPorNota(comDocumento)).isSameAs(documento);
        assertThrows(NotaDocumentoNaoEncontradoException.class, () -> service.buscarPorNota(semDocumento));
    }
}
