package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class MovimentacaoJaVinculadaException extends RuntimeException {
    public MovimentacaoJaVinculadaException(UUID id) {
        super("Movimentação já vinculada a outra nota: " + id);
    }
}
