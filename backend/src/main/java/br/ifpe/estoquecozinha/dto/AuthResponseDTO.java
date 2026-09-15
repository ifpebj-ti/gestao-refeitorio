package br.ifpe.estoquecozinha.dto;

import br.ifpe.estoquecozinha.model.enums.Perfil;

public record AuthResponseDTO(
        String token,
        String nome,
        String email,
        Perfil perfil
) {
}
