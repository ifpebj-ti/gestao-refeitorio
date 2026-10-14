package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.UsuarioEdicaoDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioResponseDTO;
import br.ifpe.gestaorefeitorio.exception.AutoDesativacaoNaoPermitidaException;
import br.ifpe.gestaorefeitorio.exception.ConviteNaoPermitidoException;
import br.ifpe.gestaorefeitorio.exception.EmailJaCadastradoException;
import br.ifpe.gestaorefeitorio.exception.EnvioEmailException;
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
    private final ConviteService conviteService;

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
        return paraDTO(usuario, tentarEnviarConvite(usuario));
    }

    // Falha de e-mail não desfaz o cadastro (#208): o ADMIN vê conviteEnviado=false e pode reenviar.
    private boolean tentarEnviarConvite(Usuario usuario) {
        try {
            conviteService.enviarConvite(usuario);
            log.info("Convite enviado para {}", usuario.getEmail());
            return true;
        } catch (EnvioEmailException e) {
            log.error("Convite não enviado para {}; o usuário continua cadastrado", usuario.getEmail());
            return false;
        }
    }

    @Override
    public void reenviarConvite(UUID id) {
        Usuario usuario = buscarEntidade(id);

        if (!usuario.isAtivo()) {
            throw new ConviteNaoPermitidoException("Não é possível reenviar convite para usuário inativo");
        }
        if (usuario.getPrimeiroAcessoEm() != null) {
            throw new ConviteNaoPermitidoException("Usuário já acessou o sistema; não é preciso reenviar o convite");
        }

        // Aqui a EnvioEmailException sobe (503): o reenvio foi pedido explicitamente pelo ADMIN.
        conviteService.enviarConvite(usuario);
        log.info("Convite reenviado para {}", usuario.getEmail());
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
        return paraDTO(usuario, null);
    }

    private UsuarioResponseDTO paraDTO(Usuario usuario, Boolean conviteEnviado) {
        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil(),
                usuario.isAtivo(),
                usuario.getCriadoEm(),
                usuario.getPrimeiroAcessoEm(),
                conviteEnviado);
    }
}
