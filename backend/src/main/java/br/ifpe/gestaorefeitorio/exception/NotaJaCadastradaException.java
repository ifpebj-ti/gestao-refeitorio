package br.ifpe.gestaorefeitorio.exception;

public class NotaJaCadastradaException extends RuntimeException {
    public NotaJaCadastradaException() {
        super("Já existe uma nota com esse número para o remetente informado");
    }
}
