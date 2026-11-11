package br.ifpe.gestaorefeitorio.job;

import br.ifpe.gestaorefeitorio.service.LoginLocalService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Cria os usuários do login local ao subir com o profile seguranca (#298). Sem migration,
 * pra nada disso chegar ao banco de produção. O erro não é engolido: o profile é só local.
 */
@Component
@Profile("seguranca")
@RequiredArgsConstructor
public class UsuariosLocaisInicializador {

    private final LoginLocalService loginLocalService;

    @EventListener(ApplicationReadyEvent.class)
    public void aoSubir() {
        loginLocalService.garantirUsuariosLocais();
    }
}
