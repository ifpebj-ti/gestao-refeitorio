package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.DefinirSenhaRequestDTO;
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

    void reenviarConvite(UUID id);

    /** Define ou redefine a senha local do usuário e libera o bloqueio de tentativas de login dele (#367). */
    void definirSenha(UUID id, DefinirSenhaRequestDTO request, Usuario adminAutenticado);

    /** Remove a senha local: o usuário volta a entrar só pelo Google. Idempotente (#367). */
    void removerSenha(UUID id, Usuario adminAutenticado);
}
