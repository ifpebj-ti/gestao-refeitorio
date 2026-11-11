package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.exception.EnvioEmailException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
@Service
public class AdminInicialServiceImpl implements AdminInicialService {

    private static final Pattern FORMATO_EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UsuarioRepository usuarioRepository;
    private final ConviteService conviteService;
    private final String email;
    private final String nome;

    public AdminInicialServiceImpl(UsuarioRepository usuarioRepository,
                                   ConviteService conviteService,
                                   @Value("${admin.inicial.email:}") String email,
                                   @Value("${admin.inicial.nome:Administrador}") String nome) {
        this.usuarioRepository = usuarioRepository;
        this.conviteService = conviteService;
        // O e-mail do Google chega em minúsculas no login; normalizar evita um ADMIN que nunca consegue entrar.
        this.email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        this.nome = nome == null || nome.isBlank() ? "Administrador" : nome.trim();
    }

    @Override
    @Transactional
    public void garantirAdminInicial() {
        // Decide pelo estado do banco, não por flag: com um ADMIN ativo, deploys seguintes não mexem em nada.
        if (usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)) {
            log.debug("Já existe ADMIN ativo; criação do ADMIN inicial ignorada");
            return;
        }

        if (!FORMATO_EMAIL.matcher(email).matches()) {
            log.warn("Nenhum ADMIN ativo e ADMIN_INICIAL_EMAIL ausente ou inválido; nenhum ADMIN foi criado");
            return;
        }

        Usuario admin = usuarioRepository.findByEmail(email)
                .map(this::promover)
                .orElseGet(this::criar);
        admin = usuarioRepository.save(admin);

        // Falha de e-mail não desfaz a criação: o ADMIN ainda consegue entrar pela tela de login.
        try {
            conviteService.enviarConvite(admin);
            log.info("Convite enviado para {}", admin.getEmail());
        } catch (EnvioEmailException e) {
            log.error("Convite não enviado para o ADMIN inicial {}; o usuário continua criado", admin.getEmail());
        }
    }

    private Usuario promover(Usuario usuario) {
        usuario.setPerfil(Perfil.ADMIN);
        usuario.setAtivo(true);
        log.info("ADMIN inicial promovido: {}", usuario.getEmail());
        return usuario;
    }

    private Usuario criar() {
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setPerfil(Perfil.ADMIN);
        usuario.setAtivo(true);
        log.info("ADMIN inicial criado: {}", email);
        return usuario;
    }
}
