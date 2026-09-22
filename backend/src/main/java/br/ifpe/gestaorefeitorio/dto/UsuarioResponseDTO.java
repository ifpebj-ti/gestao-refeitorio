package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.Perfil;

import java.time.Instant;
import java.util.UUID;

public record UsuarioResponseDTO(
        UUID id,
        String nome,
        String email,
        Perfil perfil,
        boolean ativo,
        Instant criadoEm
) {
}
