package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.NotaResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;

public interface NotaService {
    /**
     * Registra a nota com status PENDENTE, vinculada às entradas informadas. Cada entrada só pode
     * pertencer a uma nota, e o número só é único dentro do mesmo remetente.
     */
    NotaResponseDTO registrar(NotaRequestDTO request, Usuario registradoPor);
}
