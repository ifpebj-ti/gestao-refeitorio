package br.ifpe.gestaorefeitorio.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * Job diário que verifica produtos com validade próxima do limite
 * (principalmente frios). Requisito levantado pelo cliente.
 * Hoje apenas loga; evoluir para notificação in-app / e-mail.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AlertaValidadeJob {

    private final ProdutoRepository produtoRepository;

    // Roda todo dia às 06:00.
    @Scheduled(cron = "0 0 6 * * *")
    public void verificarValidades() {
        LocalDate limite = LocalDate.now().plusDays(3); // janela padrão; pode virar config por produto
        List<Produto> proximosDoVencimento = produtoRepository.buscarComValidadeProxima(limite);

        if (!proximosDoVencimento.isEmpty()) {
            log.warn("{} produto(s) com validade próxima do limite", proximosDoVencimento.size());
            // TODO: disparar notificação (in-app / e-mail) para o perfil NUTRICIONISTA
        }
    }
}
