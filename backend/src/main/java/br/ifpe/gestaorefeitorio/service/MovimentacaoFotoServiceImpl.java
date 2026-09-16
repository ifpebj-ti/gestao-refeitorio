package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoFotoResponseDTO;
import br.ifpe.gestaorefeitorio.exception.ArquivoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoFotoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.MovimentacaoNaoEncontradaException;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.MovimentacaoFoto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoFotoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovimentacaoFotoServiceImpl implements MovimentacaoFotoService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/jpeg", "image/png");
    private static final long TAMANHO_MAXIMO_BYTES = 5L * 1024 * 1024; // 5MB

    private final MovimentacaoFotoRepository movimentacaoFotoRepository;
    private final MovimentacaoRepository movimentacaoRepository;

    @Override
    public MovimentacaoFotoResponseDTO anexar(UUID movimentacaoId, MultipartFile arquivo, Usuario responsavel) {
        Movimentacao movimentacao = movimentacaoRepository.findById(movimentacaoId)
                .orElseThrow(() -> new MovimentacaoNaoEncontradaException(movimentacaoId));

        validar(arquivo);

        // Se já existir foto anexada, substitui (não é obrigatório nem impedido anexar de novo).
        MovimentacaoFoto foto = movimentacaoFotoRepository.findByMovimentacaoId(movimentacaoId)
                .orElseGet(MovimentacaoFoto::new);
        foto.setMovimentacao(movimentacao);
        foto.setContentType(arquivo.getContentType());
        foto.setTamanhoBytes(arquivo.getSize());
        try {
            foto.setConteudo(arquivo.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao ler o arquivo enviado", e);
        }
        foto = movimentacaoFotoRepository.save(foto);

        log.info("Foto anexada: movimentação {}, {} bytes, por {}",
                movimentacaoId, foto.getTamanhoBytes(), responsavel.getEmail());

        return new MovimentacaoFotoResponseDTO(
                movimentacaoId, foto.getContentType(), foto.getTamanhoBytes(), foto.getCriadoEm());
    }

    @Override
    public MovimentacaoFoto buscarPorMovimentacao(UUID movimentacaoId) {
        if (!movimentacaoRepository.existsById(movimentacaoId)) {
            throw new MovimentacaoNaoEncontradaException(movimentacaoId);
        }
        return movimentacaoFotoRepository.findByMovimentacaoId(movimentacaoId)
                .orElseThrow(() -> new MovimentacaoFotoNaoEncontradaException(movimentacaoId));
    }

    private void validar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ArquivoInvalidoException("Arquivo é obrigatório");
        }
        if (!TIPOS_PERMITIDOS.contains(arquivo.getContentType())) {
            throw new ArquivoInvalidoException("Tipo de arquivo não permitido (aceito apenas JPEG/PNG)");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new ArquivoInvalidoException("Arquivo excede o tamanho máximo permitido (5MB)");
        }
    }
}
