package br.ifpe.gestaorefeitorio.exception;

public class TokenGoogleInvalidoException extends RuntimeException {
    public TokenGoogleInvalidoException() {
        super("Token do Google inválido ou expirado");
    }
}
