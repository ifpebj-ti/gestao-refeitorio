package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Slf4j
@Service
public class AdminLocalServiceImpl implements AdminLocalService {

    private static final Pattern FORMATO_EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final int TAMANHO_MINIMO_SENHA = 12;
    // O BCrypt só considera os primeiros 72 bytes e a biblioteca rejeita senhas maiores.
    private static final int TAMANHO_MAXIMO_SENHA_BYTES = 72;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String nome;
    private final String senha;

    public AdminLocalServiceImpl(UsuarioRepository usuarioRepository,
                                 PasswordEncoder passwordEncoder,
                                 @Value("${admin.local.email:}") String email,
                                 @Value("${admin.local.nome:Administrador local}") String nome,
                                 @Value("${admin.local.senha:}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        // O login local normaliza o e-mail do mesmo jeito; sem isso o ADMIN criado nunca conseguiria entrar.
        this.email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        this.nome = nome == null || nome.isBlank() ? "Administrador local" : nome.trim();
        this.senha = senha == null ? "" : senha;
    }

    @Override
    @Transactional
    public void garantirAdminLocal() {
        if (!configuracaoValida()) {
            return;
        }

        Optional<Usuario> existente = usuarioRepository.findByEmail(email);
        if (existente.isEmpty()) {
            criar();
            return;
        }

        Usuario usuario = existente.get();
        if (usuario.getPerfil() != Perfil.ADMIN) {
            log.error("ADMIN_LOCAL_EMAIL {} pertence a um usuário com perfil {}; nada foi alterado",
                    email, usuario.getPerfil());
            return;
        }
        // Reiniciar a aplicação nunca sobrescreve uma senha trocada depois pela gestão de usuários.
        if (usuario.getSenhaHash() != null) {
            log.debug("ADMIN local {} já tem senha; nada foi alterado", email);
            return;
        }

        usuario.setSenhaHash(passwordEncoder.encode(senha));
        usuarioRepository.save(usuario);
        log.info("Senha local definida para o ADMIN {}", email);
        if (!usuario.isAtivo()) {
            // Não reativa: a desativação foi uma decisão de um ADMIN e precisa ser desfeita por ele.
            log.warn("ADMIN local {} está inativo e continua sem conseguir entrar até ser reativado", email);
        }
    }

    private boolean configuracaoValida() {
        boolean semEmail = email.isBlank();
        boolean semSenha = senha.isBlank();
        if (semEmail && semSenha) {
            log.info("ADMIN local não configurado (ADMIN_LOCAL_EMAIL/ADMIN_LOCAL_SENHA); nada foi criado");
            return false;
        }
        if (semEmail || semSenha) {
            log.warn("ADMIN local configurado pela metade: defina ADMIN_LOCAL_EMAIL e ADMIN_LOCAL_SENHA; nada foi criado");
            return false;
        }
        if (!FORMATO_EMAIL.matcher(email).matches()) {
            log.error("ADMIN_LOCAL_EMAIL em formato inválido; o ADMIN local não foi criado");
            return false;
        }
        if (senha.length() < TAMANHO_MINIMO_SENHA) {
            log.error("ADMIN_LOCAL_SENHA precisa ter pelo menos {} caracteres; o ADMIN local não foi criado",
                    TAMANHO_MINIMO_SENHA);
            return false;
        }
        if (senha.getBytes(StandardCharsets.UTF_8).length > TAMANHO_MAXIMO_SENHA_BYTES) {
            log.error("ADMIN_LOCAL_SENHA passa de {} bytes, limite do BCrypt; o ADMIN local não foi criado",
                    TAMANHO_MAXIMO_SENHA_BYTES);
            return false;
        }
        return true;
    }

    private void criar() {
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setPerfil(Perfil.ADMIN);
        usuario.setAtivo(true);
        usuario.setSenhaHash(passwordEncoder.encode(senha));
        usuarioRepository.save(usuario);
        log.info("ADMIN local criado: {}", email);
    }
}
