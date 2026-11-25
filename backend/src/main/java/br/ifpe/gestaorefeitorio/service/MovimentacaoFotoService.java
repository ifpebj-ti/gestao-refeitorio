package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoFotoResponseDTO;
import br.ifpe.gestaorefeitorio.model.MovimentacaoFoto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface MovimentacaoFotoService {
    /** A COZINHA só anexa foto às movimentações que ela mesma registrou; nas demais, 404 (#474). */
    MovimentacaoFotoResponseDTO anexar(UUID movimentacaoId, MultipartFile arquivo, Usuario responsavel);

    /** A COZINHA só vê a foto das movimentações que ela mesma registrou; nas demais, 404 como "sem foto" (#474). */
    MovimentacaoFoto buscarPorMovimentacao(UUID movimentacaoId, Usuario usuario);
}
