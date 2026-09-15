package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.Perfil;

public record AuthResponseDTO(
                String token,
                String nome,
                String email,
                Perfil perfil) {
}
