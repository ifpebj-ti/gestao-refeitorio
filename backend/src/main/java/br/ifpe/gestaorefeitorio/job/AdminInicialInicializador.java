package br.ifpe.gestaorefeitorio.job;

import br.ifpe.gestaorefeitorio.service.AdminInicialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Garante o ADMIN inicial ao subir a aplicação (#207).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInicialInicializador {

    private final AdminInicialService adminInicialService;

    @EventListener(ApplicationReadyEvent.class)
    public void aoSubir() {
        // Erro aqui não pode derrubar a aplicação: health check DOWN faria o deploy dar rollback.
        try {
            adminInicialService.garantirAdminInicial();
        } catch (RuntimeException e) {
            log.error("Falha ao garantir o ADMIN inicial: {}", e.getClass().getSimpleName(), e);
        }
    }
}
