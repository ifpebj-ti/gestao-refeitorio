package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class MovimentacaoNaoEntradaException extends RuntimeException {
    public MovimentacaoNaoEntradaException(UUID id) {
        super("Só movimentações de ENTRADA podem ser vinculadas a uma nota: " + id);
    }
}
