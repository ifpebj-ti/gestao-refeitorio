package br.ifpe.gestaorefeitorio.exception;

public class ArquivoInvalidoException extends RuntimeException {
    public ArquivoInvalidoException(String mensagem) {
        super(mensagem);
    }
}
