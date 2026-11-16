package br.ifpe.gestaorefeitorio.job;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.service.NotificacaoEmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Job diário de validade (US16/#151, #203): frios vão como alta prioridade, os demais como prioridade normal.
 */
@ExtendWith(MockitoExtension.class)
class AlertaValidadeJobTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private NotificacaoEmailService notificacaoEmailService;

    @InjectMocks
    private AlertaValidadeJob job;

    private Produto produto(String nome, Boolean controlaValidade) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setControlaValidade(controlaValidade);
        return produto;
    }

    @Test
    void naoDeveEnviarAlertaQuandoNaoHaProdutosComValidadeProxima() {
        when(produtoRepository.buscarComValidadeProxima(any(), any())).thenReturn(List.of());

        job.verificarValidades();

        verifyNoInteractions(notificacaoEmailService);
    }

    @Test
    void deveSepararFriosComoAltaPrioridadeEDemaisComoPrioridadeNormal() {
        Produto frango = produto("Frango", true);
        Produto arroz = produto("Arroz", false);
        Produto feijao = produto("Feijão", null);
        when(produtoRepository.buscarComValidadeProxima(any(), any())).thenReturn(List.of(frango, arroz, feijao));

        job.verificarValidades();

        verify(notificacaoEmailService).enviarAlertaValidade(List.of(frango), List.of(arroz, feijao));
    }

    @Test
    void deveEnviarListaNormalVaziaQuandoSoHaFrios() {
        Produto frango = produto("Frango", true);
        when(produtoRepository.buscarComValidadeProxima(any(), any())).thenReturn(List.of(frango));

        job.verificarValidades();

        verify(notificacaoEmailService).enviarAlertaValidade(List.of(frango), List.of());
    }

    @Test
    void deveConsultarAJanelaDeTresDiasAPartirDeHoje() {
        when(produtoRepository.buscarComValidadeProxima(any(), any())).thenReturn(List.of());

        job.verificarValidades();

        ArgumentCaptor<LocalDate> hoje = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> limite = ArgumentCaptor.forClass(LocalDate.class);
        verify(produtoRepository).buscarComValidadeProxima(hoje.capture(), limite.capture());
        assertThat(limite.getValue()).isEqualTo(hoje.getValue().plusDays(3));
    }
}
