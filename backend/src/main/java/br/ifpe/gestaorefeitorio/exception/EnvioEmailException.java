package br.ifpe.gestaorefeitorio.exception;

public class EnvioEmailException extends RuntimeException {
    public EnvioEmailException(Throwable causa) {
        super("Não foi possível enviar o e-mail no momento", causa);
    }
}
