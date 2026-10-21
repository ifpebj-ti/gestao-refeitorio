package br.ifpe.gestaorefeitorio.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class AssinaturaImagemTest {

    @Test
    void deveDetectarJpeg() {
        byte[] conteudo = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10 };
        assertThat(AssinaturaImagem.detectarContentType(conteudo)).contains("image/jpeg");
    }

    @Test
    void deveDetectarPng() {
        byte[] conteudo = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00 };
        assertThat(AssinaturaImagem.detectarContentType(conteudo)).contains("image/png");
    }

    @Test
    void deveRecusarTextoPuro() {
        byte[] conteudo = "apenas um texto qualquer".getBytes(StandardCharsets.UTF_8);
        assertThat(AssinaturaImagem.detectarContentType(conteudo)).isEmpty();
    }

    @Test
    void deveRecusarExecutavelWindows() {
        byte[] conteudo = { 0x4D, 0x5A, (byte) 0x90, 0x00, 0x03, 0x00 };
        assertThat(AssinaturaImagem.detectarContentType(conteudo)).isEmpty();
    }

    @Test
    void deveRecusarScript() {
        byte[] conteudo = "#!/bin/sh\nrm -rf /\n".getBytes(StandardCharsets.UTF_8);
        assertThat(AssinaturaImagem.detectarContentType(conteudo)).isEmpty();
    }

    @Test
    void deveRecusarConteudoVazio() {
        assertThat(AssinaturaImagem.detectarContentType(new byte[0])).isEmpty();
    }

    @Test
    void deveRecusarConteudoMenorQueAAssinaturaPng() {
        byte[] conteudo = { (byte) 0x89, 0x50, 0x4E, 0x47 };
        assertThat(AssinaturaImagem.detectarContentType(conteudo)).isEmpty();
    }
}
