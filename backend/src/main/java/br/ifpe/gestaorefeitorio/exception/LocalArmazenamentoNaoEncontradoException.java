package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class LocalArmazenamentoNaoEncontradoException extends RuntimeException {
    public LocalArmazenamentoNaoEncontradoException(UUID id) {
        super("Local de armazenamento não encontrado: " + id);
    }
}
