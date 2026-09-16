package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class MovimentacaoNaoEncontradaException extends RuntimeException {
    public MovimentacaoNaoEncontradaException(UUID id) {
        super("Movimentação não encontrada: " + id);
    }
}
