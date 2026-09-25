package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class CardapioNaoEncontradoException extends RuntimeException {
    public CardapioNaoEncontradoException(UUID id) {
        super("Cardápio não encontrado: " + id);
    }
}
