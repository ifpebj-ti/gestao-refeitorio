package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;
import br.ifpe.gestaorefeitorio.exception.CredenciaisInvalidasException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import br.ifpe.gestaorefeitorio.security.LoginLocalProperties;
import br.ifpe.gestaorefeitorio.security.LoginLocalProperties.UsuarioLocal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@Profile("seguranca")
public class LoginLocalServiceImpl implements LoginLocalService {

    // Comparado quando o e-mail não existe, pra o tempo de resposta não revelar quais e-mails são válidos.
    private static final byte[] HASH_FICTICIO = sha256("login-local-email-inexistente");

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final Map<String, CredencialLocal> credenciais;

    public LoginLocalServiceImpl(UsuarioRepository usuarioRepository, JwtService jwtService,
                                 LoginLocalProperties properties) {
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.credenciais = List.of(
                        new CredencialLocal(properties.nutricionista(), Perfil.NUTRICIONISTA),
                        new CredencialLocal(properties.cozinha(), Perfil.COZINHA))
                .stream()
                .collect(Collectors.toMap(c -> c.usuario().email(), Function.identity()));
    }

    @Override
    public AuthResponseDTO autenticar(LoginLocalRequestDTO request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        CredencialLocal credencial = credenciais.get(email);

        // Compara hashes (tamanho fixo) com MessageDigest.isEqual: tempo constante e sem vazar o tamanho da senha.
        byte[] esperado = credencial != null ? credencial.hashSenha() : HASH_FICTICIO;
        boolean senhaConfere = MessageDigest.isEqual(sha256(request.senha()), esperado);
        if (credencial == null || !senhaConfere) {
            log.info("Login local negado: {}", email);
            throw new CredenciaisInvalidasException();
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .filter(Usuario::isAtivo)
                .orElseThrow(() -> {
                    log.info("Login local negado: {} não está cadastrado ou está inativo", email);
                    return new CredenciaisInvalidasException();
                });

        String token = jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
        log.info("Login local realizado: {}", email);
        return new AuthResponseDTO(token, usuario.getNome(), usuario.getEmail(), usuario.getPerfil());
    }

    @Override
    @Transactional
    public void garantirUsuariosLocais() {
        for (CredencialLocal credencial : credenciais.values()) {
            UsuarioLocal local = credencial.usuario();
            Usuario usuario = usuarioRepository.findByEmail(local.email()).orElseGet(Usuario::new);
            usuario.setEmail(local.email());
            usuario.setNome(local.nome());
            usuario.setPerfil(credencial.perfil());
            usuario.setAtivo(true);
            usuarioRepository.save(usuario);
            log.info("Usuário local de teste pronto: {} ({})", local.email(), credencial.perfil());
        }
    }

    private static byte[] sha256(String valor) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(valor.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível na JVM", e);
        }
    }

    private record CredencialLocal(UsuarioLocal usuario, Perfil perfil, byte[] hashSenha) {

        CredencialLocal(UsuarioLocal usuario, Perfil perfil) {
            this(usuario, perfil, sha256(usuario.senha()));
        }
    }
}
