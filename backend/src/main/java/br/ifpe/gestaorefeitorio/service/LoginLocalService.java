package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;

/**
 * Login por e-mail e senha só para testes de segurança locais (#298); existe apenas no profile seguranca.
 */
public interface LoginLocalService {

    /**
     * Devolve o mesmo JWT do login com Google.
     *
     * @throws br.ifpe.gestaorefeitorio.exception.CredenciaisInvalidasException para e-mail
     *         desconhecido, senha errada ou usuário inativo (401 genérico).
     */
    AuthResponseDTO autenticar(LoginLocalRequestDTO request);

    /** Cria ou atualiza os dois usuários de teste configurados; pode rodar várias vezes. */
    void garantirUsuariosLocais();
}
