package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;

public interface AuthService {
    AuthResponseDTO autenticarComGoogle(String idToken);
}
