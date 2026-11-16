package br.ifpe.gestaorefeitorio.job;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.service.NotificacaoEmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.*;

/**
 * Job diário de estoque baixo (US15/#148, #203).
 */
@ExtendWith(MockitoExtension.class)
class AlertaEstoqueBaixoJobTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private NotificacaoEmailService notificacaoEmailService;

    @InjectMocks
    private AlertaEstoqueBaixoJob job;

    @Test
    void naoDeveEnviarAlertaQuandoNenhumProdutoEstaAbaixoDoMinimo() {
        when(produtoRepository.buscarComEstoqueBaixo()).thenReturn(List.of());

        job.verificarEstoqueBaixo();

        verifyNoInteractions(notificacaoEmailService);
    }

    @Test
    void deveEnviarAlertaComOsProdutosAbaixoDoMinimo() {
        Produto arroz = new Produto();
        arroz.setNome("Arroz");
        List<Produto> abaixoDoMinimo = List.of(arroz);
        when(produtoRepository.buscarComEstoqueBaixo()).thenReturn(abaixoDoMinimo);

        job.verificarEstoqueBaixo();

        verify(notificacaoEmailService).enviarAlertaEstoqueBaixo(abaixoDoMinimo);
    }
}
