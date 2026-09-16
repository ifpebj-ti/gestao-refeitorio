package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.Perfil;

public record UsuarioAutenticadoDTO(
        String nome,
        String email,
        Perfil perfil
) {
}
