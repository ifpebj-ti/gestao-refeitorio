package br.ifpe.gestaorefeitorio.exception;

import java.util.UUID;

public class UsuarioNaoEncontradoPorIdException extends RuntimeException {
    public UsuarioNaoEncontradoPorIdException(UUID id) {
        super("Usuário não encontrado: " + id);
    }
}
