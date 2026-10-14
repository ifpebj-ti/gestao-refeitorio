package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ConviteServiceImpl implements ConviteService {

    private static final String ASSUNTO = "[Gestão Refeitório] Você recebeu acesso ao sistema";

    private final EmailService emailService;
    private final String urlLogin;

    public ConviteServiceImpl(EmailService emailService, @Value("${email.convite.url-login}") String urlLogin) {
        this.emailService = emailService;
        this.urlLogin = urlLogin;
    }

    @Override
    public void enviarConvite(Usuario usuario) {
        String corpo = """
                Olá, %s!

                Você recebeu acesso ao sistema de Gestão de Estoque da Cozinha do IFPE Campus Belo Jardim, \
                com o perfil %s.

                Para entrar, acesse %s e clique em "Entrar com Google" usando esta mesma conta: %s

                Não é preciso criar senha: o acesso é feito só pela sua conta Google.
                """.formatted(usuario.getNome(), usuario.getPerfil(), urlLogin, usuario.getEmail());

        emailService.enviar(usuario.getEmail(), ASSUNTO, corpo);
    }
}
