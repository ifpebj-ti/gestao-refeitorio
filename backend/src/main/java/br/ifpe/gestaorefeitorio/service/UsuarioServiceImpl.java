package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.UsuarioEdicaoDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioResponseDTO;
import br.ifpe.gestaorefeitorio.exception.AutoDesativacaoNaoPermitidaException;
import br.ifpe.gestaorefeitorio.exception.EmailJaCadastradoException;
import br.ifpe.gestaorefeitorio.exception.UsuarioNaoEncontradoPorIdException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UsuarioResponseDTO cadastrar(UsuarioRequestDTO request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            log.info("Cadastro negado: e-mail {} já cadastrado", request.email());
            throw new EmailJaCadastradoException();
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        usuario.setPerfil(request.perfil());
        usuario.setAtivo(true);
        usuario = usuarioRepository.save(usuario);

        log.info("Usuário cadastrado: {} (perfil {})", usuario.getEmail(), usuario.getPerfil());
        return paraDTO(usuario);
    }

    @Override
    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(this::paraDTO)
                .toList();
    }

    @Override
    public UsuarioResponseDTO buscarPorId(UUID id) {
        return paraDTO(buscarEntidade(id));
    }

    @Override
    public UsuarioResponseDTO editar(UUID id, UsuarioEdicaoDTO request) {
        Usuario usuario = buscarEntidade(id);
        usuario.setNome(request.nome());
        usuario.setPerfil(request.perfil());
        usuario = usuarioRepository.save(usuario);

        log.info("Usuário editado: {}", usuario.getEmail());
        return paraDTO(usuario);
    }

    @Override
    public UsuarioResponseDTO desativar(UUID id, Usuario adminAutenticado) {
        Usuario usuario = buscarEntidade(id);

        if (usuario.getId().equals(adminAutenticado.getId())) {
            log.info("Autodesativação bloqueada para {}", adminAutenticado.getEmail());
            throw new AutoDesativacaoNaoPermitidaException();
        }

        usuario.setAtivo(false);
        usuario = usuarioRepository.save(usuario);

        log.info("Usuário desativado: {} (por {})", usuario.getEmail(), adminAutenticado.getEmail());
        return paraDTO(usuario);
    }

    private Usuario buscarEntidade(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNaoEncontradoPorIdException(id));
    }

    private UsuarioResponseDTO paraDTO(Usuario usuario) {
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil(),
                usuario.isAtivo(),
                usuario.getCriadoEm());
    }
}
