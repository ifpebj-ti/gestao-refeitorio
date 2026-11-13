package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;

/**
 * Login por e-mail e senha local (hash BCrypt em {@code usuarios.senha_hash}), em todos os ambientes (#365).
 */
public interface LoginLocalService {

    /**
     * Devolve o mesmo JWT do login com Google.
     *
     * @throws br.ifpe.gestaorefeitorio.exception.CredenciaisInvalidasException para e-mail desconhecido,
     *         senha errada, usuário sem senha local ou inativo (401 genérico).
     * @throws br.ifpe.gestaorefeitorio.exception.LoginBloqueadoException após tentativas erradas seguidas (429).
     */
    AuthResponseDTO autenticar(LoginLocalRequestDTO request);
}
