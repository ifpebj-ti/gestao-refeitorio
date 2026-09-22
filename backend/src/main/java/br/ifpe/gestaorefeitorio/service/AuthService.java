package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioAutenticadoDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;

public interface AuthService {
    AuthResponseDTO autenticarComGoogle(String idToken);

    UsuarioAutenticadoDTO usuarioAutenticado(Usuario usuario);
}
