package br.ifpe.gestaorefeitorio.service;

import java.util.Arrays;
import java.util.Optional;

/**
 * Identifica JPEG/PNG pelos primeiros bytes do arquivo, já que o Content-Type enviado
 * pelo cliente pode ser forjado (#230, A17/R09).
 */
final class AssinaturaImagem {

    private static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF };
    private static final byte[] PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

    private AssinaturaImagem() {
    }

    static Optional<String> detectarContentType(byte[] conteudo) {
        if (comecaCom(conteudo, JPEG)) {
            return Optional.of("image/jpeg");
        }
        if (comecaCom(conteudo, PNG)) {
            return Optional.of("image/png");
        }
        return Optional.empty();
    }

    private static boolean comecaCom(byte[] conteudo, byte[] assinatura) {
        return conteudo != null
                && conteudo.length >= assinatura.length
                && Arrays.equals(conteudo, 0, assinatura.length, assinatura, 0, assinatura.length);
    }
}
