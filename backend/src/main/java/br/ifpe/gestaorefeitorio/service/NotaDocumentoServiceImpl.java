package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaDocumentoResponseDTO;
import br.ifpe.gestaorefeitorio.exception.ArquivoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.NotaDocumentoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoEncontradaException;
import br.ifpe.gestaorefeitorio.exception.NotaNaoPendenteException;
import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.NotaDocumento;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import br.ifpe.gestaorefeitorio.repository.NotaDocumentoRepository;
import br.ifpe.gestaorefeitorio.repository.NotaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotaDocumentoServiceImpl implements NotaDocumentoService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("application/pdf", "image/jpeg", "image/png");
    private static final long TAMANHO_MAXIMO_BYTES = 5L * 1024 * 1024; // 5MB

    private final NotaDocumentoRepository notaDocumentoRepository;
    private final NotaRepository notaRepository;

    @Override
    @Transactional
    public NotaDocumentoResponseDTO anexar(UUID notaId, MultipartFile arquivo, Usuario responsavel) {
        Nota nota = notaRepository.findById(notaId).orElseThrow(() -> new NotaNaoEncontradaException(notaId));
        // Nota validada ou cancelada é definitiva: nem o primeiro anexo nem a troca são aceitos.
        if (nota.getStatus() != StatusNota.PENDENTE) {
            throw new NotaNaoPendenteException(nota.getStatus());
        }

        validar(arquivo);

        byte[] conteudo;
        try {
            conteudo = arquivo.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao ler o arquivo enviado", e);
        }
        // O tipo declarado pelo cliente pode ser forjado: os bytes precisam confirmar exatamente esse tipo.
        String contentTypeReal = AssinaturaDocumento.detectarContentType(conteudo)
                .filter(detectado -> detectado.equals(arquivo.getContentType()))
                .orElseThrow(() -> {
                    log.warn("Documento rejeitado por assinatura divergente: nota {}, content-type declarado {}, por {}",
                            notaId, arquivo.getContentType(), responsavel.getEmail());
                    return new ArquivoInvalidoException(
                            "Conteúdo do arquivo não corresponde ao tipo declarado (PDF, JPEG ou PNG)");
                });

        NotaDocumento documento = notaDocumentoRepository.findByNotaId(notaId).orElse(null);
        boolean substituicao = documento != null;
        if (documento == null) {
            documento = new NotaDocumento();
            documento.setNota(nota);
        }
        documento.setContentType(contentTypeReal);
        documento.setTamanhoBytes(arquivo.getSize());
        documento.setConteudo(conteudo);
        documento = notaDocumentoRepository.save(documento);

        log.info("Documento {}: nota {}, {}, {} bytes, por {}", substituicao ? "substituído" : "anexado",
                notaId, contentTypeReal, documento.getTamanhoBytes(), responsavel.getEmail());

        return new NotaDocumentoResponseDTO(
                notaId, documento.getContentType(), documento.getTamanhoBytes(), documento.getCriadoEm());
    }

    @Override
    @Transactional(readOnly = true)
    public NotaDocumento buscarPorNota(UUID notaId) {
        if (!notaRepository.existsById(notaId)) {
            throw new NotaNaoEncontradaException(notaId);
        }
        return notaDocumentoRepository.findByNotaId(notaId)
                .orElseThrow(() -> new NotaDocumentoNaoEncontradoException(notaId));
    }

    private void validar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ArquivoInvalidoException("Arquivo é obrigatório");
        }
        if (!TIPOS_PERMITIDOS.contains(arquivo.getContentType())) {
            throw new ArquivoInvalidoException("Tipo de arquivo não permitido (aceito apenas PDF, JPEG ou PNG)");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new ArquivoInvalidoException("Arquivo excede o tamanho máximo permitido (5MB)");
        }
    }
}
