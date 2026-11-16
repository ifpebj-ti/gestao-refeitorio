package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

// Nota sem documento é um resultado válido (o anexo é opcional), respondido como 404.
public class NotaDocumentoNaoEncontradoException extends RuntimeException {
    public NotaDocumentoNaoEncontradoException(UUID notaId) {
        super("Nota sem documento anexado: " + notaId);
    }
}
