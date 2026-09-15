package br.ifpe.gestaorefeitorio.exception;

public class UsuarioInativoException extends RuntimeException {
    public UsuarioInativoException() {
        super("Usuário está inativo");
    }
}
