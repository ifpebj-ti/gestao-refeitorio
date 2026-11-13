package br.ifpe.gestaorefeitorio.job;

import br.ifpe.gestaorefeitorio.service.AdminLocalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Garante o ADMIN com login local ao subir a aplicação (#366).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminLocalInicializador {

    private final AdminLocalService adminLocalService;

    // Depois do ADMIN inicial via Google (#207): ele só é criado se não houver ADMIN ativo,
    // e o ADMIN local criado antes faria o do Google nunca existir num banco novo.
    @Order(2)
    @EventListener(ApplicationReadyEvent.class)
    public void aoSubir() {
        // Erro aqui não pode derrubar a aplicação: health check DOWN faria o deploy dar rollback.
        try {
            adminLocalService.garantirAdminLocal();
        } catch (RuntimeException e) {
            log.error("Falha ao garantir o ADMIN local: {}", e.getClass().getSimpleName(), e);
        }
    }
}
