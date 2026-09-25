package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoAgregadaDTO;
import br.ifpe.gestaorefeitorio.dto.RelatorioMensalItemDTO;
import br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Cobre os critérios de aceite da US19/#160 na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class RelatorioServiceImplTest {

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @InjectMocks
    private RelatorioServiceImpl relatorioService;

    @Test
    void deveGerarRelatorioConsolidandoEntradasSaidasProducaoInternaEValor() {
        UUID produtoId = UUID.randomUUID();
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        MovimentacaoAgregadaDTO agregado = new MovimentacaoAgregadaDTO(
                produtoId, "Arroz", new BigDecimal("30"), new BigDecimal("10"),
                new BigDecimal("5"), new BigDecimal("150.00"));

        when(movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim)).thenReturn(List.of(agregado));
        when(movimentacaoRepository.calcularSaldoTotalAteData(produtoId, dataFim)).thenReturn(new BigDecimal("45"));

        List<RelatorioMensalItemDTO> resposta = relatorioService.gerarRelatorioMensal(dataInicio, dataFim);

        assertThat(resposta).hasSize(1);
        RelatorioMensalItemDTO item = resposta.get(0);
        assertThat(item.produtoId()).isEqualTo(produtoId);
        assertThat(item.produtoNome()).isEqualTo("Arroz");
        assertThat(item.quantidadeEntradas()).isEqualByComparingTo("30");
        assertThat(item.quantidadeSaidas()).isEqualByComparingTo("10");
        assertThat(item.quantidadeProducaoInterna()).isEqualByComparingTo("5");
        assertThat(item.valorEntradas()).isEqualByComparingTo("150.00");
        assertThat(item.saldoFinal()).isEqualByComparingTo("45");
    }

    @Test
    void deveCalcularSaldoFinalConsiderandoMovimentacoesAnterioresAoPeriodo() {
        // Saldo final (45) é maior que as entradas do período (30) — prova que ele considera
        // movimentações anteriores a dataInicio, não só o delta do período.
        UUID produtoId = UUID.randomUUID();
        LocalDate dataInicio = LocalDate.of(2026, 2, 1);
        LocalDate dataFim = LocalDate.of(2026, 2, 28);
        MovimentacaoAgregadaDTO agregado = new MovimentacaoAgregadaDTO(
                produtoId, "Feijão", new BigDecimal("30"), BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("90.00"));

        when(movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim)).thenReturn(List.of(agregado));
        when(movimentacaoRepository.calcularSaldoTotalAteData(produtoId, dataFim)).thenReturn(new BigDecimal("45"));

        List<RelatorioMensalItemDTO> resposta = relatorioService.gerarRelatorioMensal(dataInicio, dataFim);

        assertThat(resposta.get(0).saldoFinal()).isEqualByComparingTo("45");
        assertThat(resposta.get(0).quantidadeEntradas()).isEqualByComparingTo("30");
    }

    @Test
    void deveLancarPeriodoInvalidoQuandoDataFimAnteriorADataInicio() {
        LocalDate dataInicio = LocalDate.of(2026, 1, 31);
        LocalDate dataFim = LocalDate.of(2026, 1, 1);

        assertThrows(PeriodoInvalidoException.class,
                () -> relatorioService.gerarRelatorioMensal(dataInicio, dataFim));

        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void deveRetornarListaVaziaQuandoSemMovimentacaoNoPeriodo() {
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        when(movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim)).thenReturn(List.of());

        List<RelatorioMensalItemDTO> resposta = relatorioService.gerarRelatorioMensal(dataInicio, dataFim);

        assertThat(resposta).isEmpty();
    }
}
