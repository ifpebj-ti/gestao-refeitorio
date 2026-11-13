package br.ifpe.gestaorefeitorio.service;

public interface AdminLocalService {

    /**
     * Cria o ADMIN de {@code admin.local.email} com a senha de {@code admin.local.senha} (hash BCrypt),
     * ou define a senha de um ADMIN que ainda não tem (#366). Nunca sobrescreve uma senha existente e
     * nunca lança exceção por configuração ausente ou inválida: a aplicação precisa subir mesmo assim.
     */
    void garantirAdminLocal();
}
