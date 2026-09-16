package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

/** Diferente de MovimentacaoNaoEncontradaException: a movimentação existe, só não tem foto anexada (estado normal). */
public class MovimentacaoFotoNaoEncontradaException extends RuntimeException {
    public MovimentacaoFotoNaoEncontradaException(UUID movimentacaoId) {
        super("Movimentação sem foto anexada: " + movimentacaoId);
    }
}
