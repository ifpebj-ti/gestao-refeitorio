package br.ifpe.gestaorefeitorio.exception;

public class EmailJaCadastradoException extends RuntimeException {
    public EmailJaCadastradoException() {
        super("Já existe um usuário cadastrado com esse e-mail");
    }
}
