package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoFotoResponseDTO;
import br.ifpe.gestaorefeitorio.model.MovimentacaoFoto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface MovimentacaoFotoService {
    MovimentacaoFotoResponseDTO anexar(UUID movimentacaoId, MultipartFile arquivo, Usuario responsavel);

    MovimentacaoFoto buscarPorMovimentacao(UUID movimentacaoId);
}
