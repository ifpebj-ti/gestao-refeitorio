package br.ifpe.gestaorefeitorio.service;

public interface AdminInicialService {

    /**
     * Cria (ou promove) o ADMIN de {@code admin.inicial.email} e envia o convite, só quando
     * não existe nenhum ADMIN ativo (#207). Nunca lança exceção por configuração ausente ou
     * falha de e-mail: a aplicação precisa subir mesmo assim.
     */
    void garantirAdminInicial();
}
