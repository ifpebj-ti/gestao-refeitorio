package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.UsuarioEdicaoDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;

import java.util.List;
import java.util.UUID;

public interface UsuarioService {
    UsuarioResponseDTO cadastrar(UsuarioRequestDTO request);

    List<UsuarioResponseDTO> listarTodos();

    UsuarioResponseDTO buscarPorId(UUID id);

    UsuarioResponseDTO editar(UUID id, UsuarioEdicaoDTO request);

    UsuarioResponseDTO desativar(UUID id, Usuario adminAutenticado);
}
