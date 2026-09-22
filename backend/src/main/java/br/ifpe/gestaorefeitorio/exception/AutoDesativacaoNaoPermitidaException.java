package br.ifpe.gestaorefeitorio.exception;

public class AutoDesativacaoNaoPermitidaException extends RuntimeException {
    public AutoDesativacaoNaoPermitidaException() {
        super("Um administrador não pode desativar a própria conta");
    }
}
