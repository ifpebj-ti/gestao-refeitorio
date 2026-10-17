package br.ifpe.gestaorefeitorio.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.service.NotificacaoEmailService;

import java.util.List;

/**
 * Job diário que verifica produtos com saldo total igual ou abaixo da quantidade
 * mínima configurada (US15/#148) e envia o resumo por e-mail às nutricionistas (#203).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AlertaEstoqueBaixoJob {

    private final ProdutoRepository produtoRepository;
    private final NotificacaoEmailService notificacaoEmailService;

    // Roda todo dia às 06:05 (evita concorrer com o AlertaValidadeJob, às 06:00), no horário de
    // Brasília — sem a zone, o cron usaria o fuso do container (UTC).
    @Scheduled(cron = "0 5 6 * * *", zone = "America/Recife")
    public void verificarEstoqueBaixo() {
        List<Produto> comEstoqueBaixo = produtoRepository.buscarComEstoqueBaixo();

        if (!comEstoqueBaixo.isEmpty()) {
            log.warn("{} produto(s) com estoque igual ou abaixo da quantidade mínima", comEstoqueBaixo.size());
            notificacaoEmailService.enviarAlertaEstoqueBaixo(comEstoqueBaixo);
        }
    }
}
