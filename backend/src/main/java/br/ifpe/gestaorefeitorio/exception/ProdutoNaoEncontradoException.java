package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class ProdutoNaoEncontradoException extends RuntimeException {
    public ProdutoNaoEncontradoException(UUID id) {
        super("Produto não encontrado: " + id);
    }
}
