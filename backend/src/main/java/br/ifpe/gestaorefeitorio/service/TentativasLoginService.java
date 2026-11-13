package br.ifpe.gestaorefeitorio.service;

/**
 * Bloqueio temporário de login local após tentativas erradas seguidas para o mesmo e-mail (#365).
 */
public interface TentativasLoginService {

    /**
     * @throws br.ifpe.gestaorefeitorio.exception.LoginBloqueadoException se o e-mail estiver bloqueado (429).
     */
    void verificarBloqueio(String email);

    /** @return true quando esta falha bloqueou o e-mail. */
    boolean registrarFalha(String email);

    void registrarSucesso(String email);

    /** Esquece as falhas e o bloqueio do e-mail, por exemplo quando o ADMIN redefine a senha (#367). */
    void limpar(String email);
}
