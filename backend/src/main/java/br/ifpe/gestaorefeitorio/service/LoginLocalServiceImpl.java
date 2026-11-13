package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;
import br.ifpe.gestaorefeitorio.exception.CredenciaisInvalidasException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
public class LoginLocalServiceImpl implements LoginLocalService {

    // O BCrypt só considera os primeiros 72 bytes e a biblioteca rejeita senhas maiores.
    private static final int TAMANHO_MAXIMO_SENHA_BYTES = 72;
    private static final String SENHA_FICTICIA = "senha-ficticia-para-equalizar-tempo";

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final TentativasLoginService tentativasLoginService;
    // Comparado quando não há hash real, pra o tempo de resposta não revelar quais contas existem.
    private final String hashFicticio;

    public LoginLocalServiceImpl(UsuarioRepository usuarioRepository, JwtService jwtService,
                                 PasswordEncoder passwordEncoder, TentativasLoginService tentativasLoginService) {
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.tentativasLoginService = tentativasLoginService;
        this.hashFicticio = passwordEncoder.encode(SENHA_FICTICIA);
    }

    @Override
    @Transactional
    public AuthResponseDTO autenticar(LoginLocalRequestDTO request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        log.debug("Tentativa de login local: {}", email);
        tentativasLoginService.verificarBloqueio(email);

        Optional<Usuario> encontrado = usuarioRepository.findByEmail(email);
        String hash = encontrado.map(Usuario::getSenhaHash).orElse(null);
        boolean senhaConfere = senhaConfere(request.senha(), hash);

        if (!senhaConfere || encontrado.isEmpty() || !encontrado.get().isAtivo()) {
            boolean bloqueou = tentativasLoginService.registrarFalha(email);
            if (bloqueou) {
                log.info("Login local bloqueado temporariamente após tentativas erradas: {}", email);
            } else {
                log.info("Login local negado: {}", email);
            }
            throw new CredenciaisInvalidasException();
        }

        Usuario usuario = encontrado.get();
        tentativasLoginService.registrarSucesso(email);
        if (usuario.getPrimeiroAcessoEm() == null) {
            usuario.setPrimeiroAcessoEm(Instant.now());
            usuarioRepository.save(usuario);
            log.info("Primeiro acesso registrado: {}", email);
        }

        String token = jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
        log.info("Login local realizado: {}", email);
        return new AuthResponseDTO(token, usuario.getNome(), usuario.getEmail(), usuario.getPerfil());
    }

    // Sempre roda um BCrypt (contra o hash real ou o fictício) para o tempo ser o mesmo em todos os casos.
    private boolean senhaConfere(String senha, String hash) {
        boolean senhaValida = senha.getBytes(StandardCharsets.UTF_8).length <= TAMANHO_MAXIMO_SENHA_BYTES;
        boolean confere = passwordEncoder.matches(senhaValida ? senha : SENHA_FICTICIA,
                hash != null ? hash : hashFicticio);
        return senhaValida && hash != null && confere;
    }
}
