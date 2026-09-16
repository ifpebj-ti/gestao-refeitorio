package br.ifpe.gestaorefeitorio.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioAutenticadoDTO;
import br.ifpe.gestaorefeitorio.exception.UsuarioInativoException;
import br.ifpe.gestaorefeitorio.exception.UsuarioNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.GoogleTokenValidator;
import br.ifpe.gestaorefeitorio.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final GoogleTokenValidator googleTokenValidator;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @Override
    public AuthResponseDTO autenticarComGoogle(String idToken) {
        GoogleIdToken.Payload payload = googleTokenValidator.validar(idToken);
        String email = payload.getEmail();

        log.debug("Validando login para e-mail extraído do id_token do Google: {}", email);

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.info("Login negado: e-mail {} não está cadastrado", email);
                    return new UsuarioNaoEncontradoException();
                });

        if (!usuario.isAtivo()) {
            log.info("Login negado: usuário {} está inativo", email);
            throw new UsuarioInativoException();
        }

        String token = jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
        log.info("Login realizado com sucesso: {}", email);

        return new AuthResponseDTO(token, usuario.getNome(), usuario.getEmail(), usuario.getPerfil());
    }

    @Override
    public UsuarioAutenticadoDTO usuarioAutenticado(Usuario usuario) {
        return new UsuarioAutenticadoDTO(usuario.getNome(), usuario.getEmail(), usuario.getPerfil());
    }
}
