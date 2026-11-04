package br.ifpe.gestaorefeitorio.exception;

public class MovimentacoesRepetidasException extends RuntimeException {
    public MovimentacoesRepetidasException() {
        super("movimentacaoIds não pode conter IDs repetidos");
    }
}
