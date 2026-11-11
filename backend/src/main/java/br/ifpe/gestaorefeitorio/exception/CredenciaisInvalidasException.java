package br.ifpe.gestaorefeitorio.exception;

// Mesma mensagem para e-mail desconhecido, senha errada e usuário inativo: não revela quais e-mails existem.
public class CredenciaisInvalidasException extends RuntimeException {
    public CredenciaisInvalidasException() {
        super("E-mail ou senha inválidos");
    }
}
