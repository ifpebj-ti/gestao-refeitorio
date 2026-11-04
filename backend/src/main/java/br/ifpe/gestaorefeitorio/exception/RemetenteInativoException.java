package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class RemetenteInativoException extends RuntimeException {
    public RemetenteInativoException(UUID id) {
        super("Remetente inativo não pode receber novas notas: " + id);
    }
}
