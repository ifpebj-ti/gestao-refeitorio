package br.ifpe.gestaorefeitorio.dto;

import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.UUID;

public record UsuarioResponseDTO(
        UUID id,
        String nome,
        String email,
        Perfil perfil,
        boolean ativo,
        Instant criadoEm,
        Instant primeiroAcessoEm,
        // Só preenchido na resposta do cadastro (#208); nas demais operações fica fora do JSON.
        @JsonInclude(JsonInclude.Include.NON_NULL) Boolean conviteEnviado
) {
}
