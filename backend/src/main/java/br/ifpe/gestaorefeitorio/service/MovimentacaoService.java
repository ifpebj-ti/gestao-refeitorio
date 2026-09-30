package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoSaidaRequestDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;
import java.util.List;

public interface MovimentacaoService {
    MovimentacaoResponseDTO registrarEntrada(MovimentacaoRequestDTO request, Usuario responsavel);

    MovimentacaoResponseDTO registrarSaida(MovimentacaoSaidaRequestDTO request, Usuario responsavel);
    
    List<MovimentacaoResponseDTO> listarHistorico();
}