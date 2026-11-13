package br.ifpe.gestaorefeitorio.exception;

import lombok.Getter;

// Mesma mensagem para qualquer e-mail, existente ou não: o bloqueio não revela quais contas existem.
@Getter
public class LoginBloqueadoException extends RuntimeException {

    private final long segundosRestantes;

    public LoginBloqueadoException(long segundosRestantes) {
        super("Muitas tentativas de login. Tente novamente em alguns minutos.");
        this.segundosRestantes = segundosRestantes;
    }
}
