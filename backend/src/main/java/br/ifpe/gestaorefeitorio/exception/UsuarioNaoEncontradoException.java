package br.ifpe.gestaorefeitorio.exception;

public class UsuarioNaoEncontradoException extends RuntimeException {
    public UsuarioNaoEncontradoException() {
        super("Usuário não cadastrado no sistema");
    }
}
