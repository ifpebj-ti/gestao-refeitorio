package br.ifpe.gestaorefeitorio.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;

import java.util.List;

/**
 * Job diário que verifica produtos com saldo total igual ou abaixo da quantidade
 * mínima configurada (US15/#148). Mesmo padrão do AlertaValidadeJob: hoje apenas
 * loga; evoluir para notificação in-app / e-mail quando o canal for definido.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AlertaEstoqueBaixoJob {

    private final ProdutoRepository produtoRepository;

    // Roda todo dia às 06:05 (evita concorrer com o AlertaValidadeJob, às 06:00).
    @Scheduled(cron = "0 5 6 * * *")
    public void verificarEstoqueBaixo() {
        List<Produto> comEstoqueBaixo = produtoRepository.buscarComEstoqueBaixo();

        if (!comEstoqueBaixo.isEmpty()) {
            log.warn("{} produto(s) com estoque igual ou abaixo da quantidade mínima", comEstoqueBaixo.size());
            // TODO: disparar notificação (in-app / e-mail) para o perfil NUTRICIONISTA
        }
    }
}
