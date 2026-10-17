package br.ifpe.gestaorefeitorio.exception;

public class ConviteNaoPermitidoException extends RuntimeException {
    public ConviteNaoPermitidoException(String mensagem) {
        super(mensagem);
    }
}
