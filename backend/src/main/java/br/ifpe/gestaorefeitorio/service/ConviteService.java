package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.model.Usuario;

public interface ConviteService {

    /**
     * Envia o e-mail de convite com o link de login do sistema (#208).
     *
     * @throws br.ifpe.gestaorefeitorio.exception.EnvioEmailException se o SMTP falhar;
     *         o cadastro trata a falha e o reenvio deixa subir (503).
     */
    void enviarConvite(Usuario usuario);
}
