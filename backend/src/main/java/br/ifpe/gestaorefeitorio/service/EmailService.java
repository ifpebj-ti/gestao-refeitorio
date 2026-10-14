package br.ifpe.gestaorefeitorio.service;

public interface EmailService {

    /**
     * Envia um e-mail em texto puro.
     *
     * @throws br.ifpe.gestaorefeitorio.exception.EnvioEmailException se o SMTP falhar;
     *         cada chamador decide se propaga (503) ou só registra a falha.
     */
    void enviar(String destinatario, String assunto, String corpo);
}
