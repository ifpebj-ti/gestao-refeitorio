package br.ifpe.gestaorefeitorio.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.service.NotificacaoEmailService;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Job diário que verifica produtos com validade próxima do limite. Requisito
 * levantado pelo cliente. Produtos com controlaValidade = true ("frio") têm
 * destaque/prioridade maior no alerta (US16/#151) — os demais também são
 * alertados, só que com prioridade normal. O resumo vai por e-mail às nutricionistas (#203).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AlertaValidadeJob {

    private final ProdutoRepository produtoRepository;
    private final NotificacaoEmailService notificacaoEmailService;

    // Roda todo dia às 06:00 no horário de Brasília — sem a zone, o cron usaria o fuso do container (UTC).
    @Scheduled(cron = "0 0 6 * * *", zone = "America/Recife")
    public void verificarValidades() {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(3); // janela padrão; pode virar config por produto
        List<Produto> proximosDoVencimento = produtoRepository.buscarComValidadeProxima(hoje, limite);

        if (proximosDoVencimento.isEmpty()) {
            return;
        }

        var porPrioridade = proximosDoVencimento.stream()
                .collect(Collectors.partitioningBy(p -> Boolean.TRUE.equals(p.getControlaValidade())));
        List<Produto> altaPrioridade = porPrioridade.get(true);
        List<Produto> prioridadeNormal = porPrioridade.get(false);

        if (!altaPrioridade.isEmpty()) {
            log.warn("[ALTA PRIORIDADE] {} produto(s) frio(s) com validade próxima do limite: {}",
                    altaPrioridade.size(), altaPrioridade.stream().map(Produto::getNome).toList());
        }
        if (!prioridadeNormal.isEmpty()) {
            log.warn("{} produto(s) com validade próxima do limite", prioridadeNormal.size());
        }
        notificacaoEmailService.enviarAlertaValidade(altaPrioridade, prioridadeNormal);
    }
}
