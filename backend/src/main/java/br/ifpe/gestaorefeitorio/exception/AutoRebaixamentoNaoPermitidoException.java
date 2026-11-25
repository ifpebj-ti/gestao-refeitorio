package br.ifpe.gestaorefeitorio.exception;

public class AutoRebaixamentoNaoPermitidoException extends RuntimeException {
    public AutoRebaixamentoNaoPermitidoException() {
        super("Um administrador não pode remover o próprio perfil de administrador");
    }
}
