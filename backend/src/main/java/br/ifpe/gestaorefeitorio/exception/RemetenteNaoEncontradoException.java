package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class RemetenteNaoEncontradoException extends RuntimeException {
    public RemetenteNaoEncontradoException(UUID id) {
        super("Remetente não encontrado: " + id);
    }
}
