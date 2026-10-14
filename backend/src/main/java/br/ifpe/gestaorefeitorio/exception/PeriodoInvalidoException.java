package br.ifpe.gestaorefeitorio.exception;

public class PeriodoInvalidoException extends RuntimeException {
    public PeriodoInvalidoException() {
        super("Data final não pode ser anterior à data inicial");
    }
}
