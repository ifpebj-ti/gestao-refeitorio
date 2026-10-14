package br.ifpe.gestaorefeitorio.exception;

public class ProdutoComMovimentacoesException extends RuntimeException {
    public ProdutoComMovimentacoesException() {
        super("Não é possível excluir o produto porque ele possui movimentações no estoque ou vínculo em cardápio.");
    }
}
