package br.ifpe.estoquecozinha.exception;

public class TokenGoogleInvalidoException extends RuntimeException {
    public TokenGoogleInvalidoException() {
        super("Token do Google inválido ou expirado");
    }
}
