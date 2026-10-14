package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.exception.EnvioEmailException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final String remetente;

    public EmailServiceImpl(JavaMailSender mailSender, @Value("${email.remetente}") String remetente) {
        this.mailSender = mailSender;
        this.remetente = remetente;
    }

    @Override
    public void enviar(String destinatario, String assunto, String corpo) {
        log.debug("Enviando e-mail para {} com assunto '{}'", destinatario, assunto);

        // Texto puro de propósito: conteúdo com dados digitados por usuários não vira HTML injection.
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(destinatario);
        mensagem.setSubject(assunto);
        mensagem.setText(corpo);

        try {
            mailSender.send(mensagem);
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail para {}: {}", destinatario, e.getClass().getSimpleName());
            throw new EnvioEmailException(e);
        }
    }
}
