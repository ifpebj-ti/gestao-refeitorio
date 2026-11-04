package br.ifpe.gestaorefeitorio.exception;

public class RemetenteJaCadastradoException extends RuntimeException {
    public RemetenteJaCadastradoException() {
        super("Já existe um remetente cadastrado com esse nome");
    }
}
