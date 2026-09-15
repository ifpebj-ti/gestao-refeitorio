package br.ifpe.estoquecozinha.service;

import br.ifpe.estoquecozinha.dto.AuthResponseDTO;

public interface AuthService {
    AuthResponseDTO autenticarComGoogle(String idToken);
}
