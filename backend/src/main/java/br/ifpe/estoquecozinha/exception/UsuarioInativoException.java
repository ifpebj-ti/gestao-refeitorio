package br.ifpe.estoquecozinha.exception;

public class UsuarioInativoException extends RuntimeException {
    public UsuarioInativoException() {
        super("Usuário está inativo");
    }
}
