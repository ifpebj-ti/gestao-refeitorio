package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.ConsumoDiarioDTO;
import br.ifpe.gestaorefeitorio.dto.MovimentacaoAgregadaDTO;
import br.ifpe.gestaorefeitorio.dto.RelatorioMensalItemDTO;
import br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Cobre os critérios de aceite da US19/#160, da US20/#163 (exportação em
 * PDF/Excel) e da US21/#166 (gráfico de consumo) na camada de regra de
 * negócio, mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class RelatorioServiceImplTest {

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    @Mock
    private ProdutoRepository produtoRepository;

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

    @Test
    void deveGerarPdfValidoNaoVazio() {
        UUID produtoId = UUID.randomUUID();
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        MovimentacaoAgregadaDTO agregado = new MovimentacaoAgregadaDTO(
                produtoId, "Arroz", new BigDecimal("30"), new BigDecimal("10"),
                new BigDecimal("5"), new BigDecimal("150.00"));

        when(movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim)).thenReturn(List.of(agregado));
        when(movimentacaoRepository.calcularSaldoTotalAteData(produtoId, dataFim)).thenReturn(new BigDecimal("45"));

        byte[] pdf = relatorioService.exportarRelatorioMensalPdf(dataInicio, dataFim);

        assertThat(pdf).isNotEmpty();
        // Assinatura padrão de arquivos PDF, confirma que os bytes gerados são um PDF válido.
        assertThat(new String(pdf, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    void deveGerarExcelComItensCorretos() throws IOException {
        UUID produtoId = UUID.randomUUID();
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        MovimentacaoAgregadaDTO agregado = new MovimentacaoAgregadaDTO(
                produtoId, "Arroz", new BigDecimal("30"), new BigDecimal("10"),
                new BigDecimal("5"), new BigDecimal("150.00"));

        when(movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim)).thenReturn(List.of(agregado));
        when(movimentacaoRepository.calcularSaldoTotalAteData(produtoId, dataFim)).thenReturn(new BigDecimal("45"));

        byte[] excel = relatorioService.exportarRelatorioMensalExcel(dataInicio, dataFim);

        try (XSSFWorkbook planilha = new XSSFWorkbook(new ByteArrayInputStream(excel))) {
            Sheet aba = planilha.getSheetAt(0);
            Row linhaCabecalho = aba.getRow(2);
            Row linhaDado = aba.getRow(3);

            assertThat(linhaCabecalho.getCell(0).getStringCellValue()).isEqualTo("Produto");
            assertThat(linhaDado.getCell(0).getStringCellValue()).isEqualTo("Arroz");
            assertThat(linhaDado.getCell(1).getNumericCellValue()).isEqualTo(30.0);
            assertThat(linhaDado.getCell(2).getNumericCellValue()).isEqualTo(10.0);
            assertThat(linhaDado.getCell(3).getNumericCellValue()).isEqualTo(5.0);
            assertThat(linhaDado.getCell(4).getNumericCellValue()).isEqualTo(150.00);
            assertThat(linhaDado.getCell(5).getNumericCellValue()).isEqualTo(45.0);
        }
    }

    @Test
    void deveLancarPeriodoInvalidoAoExportarPdfQuandoDataFimAnteriorADataInicio() {
        LocalDate dataInicio = LocalDate.of(2026, 1, 31);
        LocalDate dataFim = LocalDate.of(2026, 1, 1);

        assertThrows(PeriodoInvalidoException.class,
                () -> relatorioService.exportarRelatorioMensalPdf(dataInicio, dataFim));

        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void deveLancarPeriodoInvalidoAoExportarExcelQuandoDataFimAnteriorADataInicio() {
        LocalDate dataInicio = LocalDate.of(2026, 1, 31);
        LocalDate dataFim = LocalDate.of(2026, 1, 1);

        assertThrows(PeriodoInvalidoException.class,
                () -> relatorioService.exportarRelatorioMensalExcel(dataInicio, dataFim));

        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void deveGerarPdfEExcelValidosSemLinhasQuandoSemMovimentacaoNoPeriodo() throws IOException {
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        when(movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim)).thenReturn(List.of());

        byte[] pdf = relatorioService.exportarRelatorioMensalPdf(dataInicio, dataFim);
        assertThat(new String(pdf, 0, 4)).isEqualTo("%PDF");

        byte[] excel = relatorioService.exportarRelatorioMensalExcel(dataInicio, dataFim);
        try (XSSFWorkbook planilha = new XSSFWorkbook(new ByteArrayInputStream(excel))) {
            Sheet aba = planilha.getSheetAt(0);
            assertThat(aba.getRow(2).getCell(0).getStringCellValue()).isEqualTo("Produto");
            assertThat(aba.getRow(3)).isNull();
        }
    }

    @Test
    void deveGerarGraficoDeConsumoAgregandoPorDia() {
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        List<ConsumoDiarioDTO> pontos = List.of(
                new ConsumoDiarioDTO(LocalDate.of(2026, 1, 10), new BigDecimal("12")),
                new ConsumoDiarioDTO(LocalDate.of(2026, 1, 15), new BigDecimal("7")));
        when(movimentacaoRepository.listarConsumoDiario(dataInicio, dataFim)).thenReturn(pontos);

        List<ConsumoDiarioDTO> resposta = relatorioService.gerarGraficoConsumo(dataInicio, dataFim, null);

        assertThat(resposta).containsExactlyElementsOf(pontos);
        verifyNoInteractions(produtoRepository);
    }

    @Test
    void deveFiltrarGraficoDeConsumoPorProdutoQuandoInformado() {
        UUID produtoId = UUID.randomUUID();
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        List<ConsumoDiarioDTO> pontos = List.of(new ConsumoDiarioDTO(LocalDate.of(2026, 1, 10), new BigDecimal("5")));

        when(produtoRepository.existsById(produtoId)).thenReturn(true);
        when(movimentacaoRepository.listarConsumoDiarioPorProduto(produtoId, dataInicio, dataFim)).thenReturn(pontos);

        List<ConsumoDiarioDTO> resposta = relatorioService.gerarGraficoConsumo(dataInicio, dataFim, produtoId);

        assertThat(resposta).containsExactlyElementsOf(pontos);
        verify(movimentacaoRepository).listarConsumoDiarioPorProduto(produtoId, dataInicio, dataFim);
    }

    @Test
    void deveLancarProdutoNaoEncontradoQuandoProdutoIdInformadoNaoExiste() {
        UUID produtoId = UUID.randomUUID();
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        when(produtoRepository.existsById(produtoId)).thenReturn(false);

        assertThrows(ProdutoNaoEncontradoException.class,
                () -> relatorioService.gerarGraficoConsumo(dataInicio, dataFim, produtoId));

        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void deveLancarPeriodoInvalidoNoGraficoDeConsumoQuandoDataFimAnteriorADataInicio() {
        LocalDate dataInicio = LocalDate.of(2026, 1, 31);
        LocalDate dataFim = LocalDate.of(2026, 1, 1);

        assertThrows(PeriodoInvalidoException.class,
                () -> relatorioService.gerarGraficoConsumo(dataInicio, dataFim, null));

        verifyNoInteractions(movimentacaoRepository, produtoRepository);
    }

    @Test
    void deveRetornarListaVaziaNoGraficoDeConsumoQuandoSemConsumoNoPeriodo() {
        LocalDate dataInicio = LocalDate.of(2026, 1, 1);
        LocalDate dataFim = LocalDate.of(2026, 1, 31);
        when(movimentacaoRepository.listarConsumoDiario(dataInicio, dataFim)).thenReturn(List.of());

        List<ConsumoDiarioDTO> resposta = relatorioService.gerarGraficoConsumo(dataInicio, dataFim, null);

        assertThat(resposta).isEmpty();
    }
}
