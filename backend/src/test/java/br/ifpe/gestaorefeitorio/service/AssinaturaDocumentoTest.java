package br.ifpe.gestaorefeitorio.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class AssinaturaDocumentoTest {

    static final byte[] PDF = "%PDF-1.7\n...".getBytes(StandardCharsets.US_ASCII);
    static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00 };
    static final byte[] PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00 };

    @Test
    void deveDetectarPdfJpegEPng() {
        assertThat(AssinaturaDocumento.detectarContentType(PDF)).contains("application/pdf");
        assertThat(AssinaturaDocumento.detectarContentType(JPEG)).contains("image/jpeg");
        assertThat(AssinaturaDocumento.detectarContentType(PNG)).contains("image/png");
    }

    @Test
    void naoDeveDetectarConteudoDesconhecidoCurtoOuNulo() {
        assertThat(AssinaturaDocumento.detectarContentType("texto qualquer".getBytes(StandardCharsets.UTF_8)))
                .isEmpty();
        assertThat(AssinaturaDocumento.detectarContentType("%PD".getBytes(StandardCharsets.US_ASCII))).isEmpty();
        assertThat(AssinaturaDocumento.detectarContentType(new byte[0])).isEmpty();
        assertThat(AssinaturaDocumento.detectarContentType(null)).isEmpty();
    }

    @Test
    void fotoDaMovimentacaoContinuaSemReconhecerPdf() {
        assertThat(AssinaturaImagem.detectarContentType(PDF)).isEmpty();
    }
}
