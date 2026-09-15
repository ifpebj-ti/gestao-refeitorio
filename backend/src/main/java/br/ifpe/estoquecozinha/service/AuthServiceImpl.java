package br.ifpe.estoquecozinha.service;

import br.ifpe.estoquecozinha.dto.AuthResponseDTO;
import br.ifpe.estoquecozinha.exception.UsuarioInativoException;
import br.ifpe.estoquecozinha.exception.UsuarioNaoEncontradoException;
import br.ifpe.estoquecozinha.model.Usuario;
import br.ifpe.estoquecozinha.repository.UsuarioRepository;
import br.ifpe.estoquecozinha.security.GoogleTokenValidator;
import br.ifpe.estoquecozinha.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
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
}
