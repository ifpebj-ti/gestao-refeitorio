package br.ifpe.gestaorefeitorio.exception;

public class DataValidadeInvalidaException extends RuntimeException {
    public DataValidadeInvalidaException() {
        super("Data de validade não pode ser anterior à data da movimentação");
    }
}
