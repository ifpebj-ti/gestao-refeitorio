package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.RemetenteRequestDTO;
import br.ifpe.gestaorefeitorio.dto.RemetenteResponseDTO;

import java.util.List;
import java.util.UUID;

public interface RemetenteService {
    RemetenteResponseDTO cadastrar(RemetenteRequestDTO request);

    /** Sem filtro ({@code ativo} nulo), lista ativos e inativos. Ordenado por nome. */
    List<RemetenteResponseDTO> listar(Boolean ativo);

    RemetenteResponseDTO buscarPorId(UUID id);

    /** Substitui nome, documento e contato: campo opcional ausente no request é apagado. */
    RemetenteResponseDTO editar(UUID id, RemetenteRequestDTO request);

    RemetenteResponseDTO inativar(UUID id);

    RemetenteResponseDTO reativar(UUID id);
}
