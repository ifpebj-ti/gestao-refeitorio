package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.ProducaoInternaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProducaoInternaResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;

public interface ProducaoInternaService {
    ProducaoInternaResponseDTO registrarRecebimento(ProducaoInternaRequestDTO request, Usuario responsavel);
}
