package br.ifpe.gestaorefeitorio.service;

import java.util.Arrays;
import java.util.Optional;

/**
 * Identifica PDF, JPEG e PNG pelos primeiros bytes do documento da nota (US28/#290).
 * A foto de movimentação continua usando só {@link AssinaturaImagem} (JPEG/PNG).
 */
final class AssinaturaDocumento {

    // "%PDF-"
    private static final byte[] PDF = { 0x25, 0x50, 0x44, 0x46, 0x2D };

    private AssinaturaDocumento() {
    }

    static Optional<String> detectarContentType(byte[] conteudo) {
        if (conteudo != null
                && conteudo.length >= PDF.length
                && Arrays.equals(conteudo, 0, PDF.length, PDF, 0, PDF.length)) {
            return Optional.of("application/pdf");
        }
        return AssinaturaImagem.detectarContentType(conteudo);
    }
}
