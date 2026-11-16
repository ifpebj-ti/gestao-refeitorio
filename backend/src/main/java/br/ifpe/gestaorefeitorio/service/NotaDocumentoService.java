package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaDocumentoResponseDTO;
import br.ifpe.gestaorefeitorio.model.NotaDocumento;
import br.ifpe.gestaorefeitorio.model.Usuario;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface NotaDocumentoService {

    /**
     * Anexa ou substitui o documento (PDF, JPEG ou PNG, até 5MB) de uma nota PENDENTE (US28/#290).
     *
     * @throws br.ifpe.gestaorefeitorio.exception.NotaNaoEncontradaException nota inexistente (404).
     * @throws br.ifpe.gestaorefeitorio.exception.NotaNaoPendenteException nota VALIDADA ou CANCELADA (409).
     * @throws br.ifpe.gestaorefeitorio.exception.ArquivoInvalidoException tipo, tamanho ou conteúdo inválido (400).
     */
    NotaDocumentoResponseDTO anexar(UUID notaId, MultipartFile arquivo, Usuario responsavel);

    /**
     * @throws br.ifpe.gestaorefeitorio.exception.NotaNaoEncontradaException nota inexistente (404).
     * @throws br.ifpe.gestaorefeitorio.exception.NotaDocumentoNaoEncontradoException nota sem documento (404).
     */
    NotaDocumento buscarPorNota(UUID notaId);
}
