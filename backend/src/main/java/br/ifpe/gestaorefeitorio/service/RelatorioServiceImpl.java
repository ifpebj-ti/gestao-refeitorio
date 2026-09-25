package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoAgregadaDTO;
import br.ifpe.gestaorefeitorio.dto.RelatorioMensalItemDTO;
import br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RelatorioServiceImpl implements RelatorioService {

    private final MovimentacaoRepository movimentacaoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RelatorioMensalItemDTO> gerarRelatorioMensal(LocalDate dataInicio, LocalDate dataFim) {
        if (dataFim.isBefore(dataInicio)) {
            throw new PeriodoInvalidoException();
        }

        List<MovimentacaoAgregadaDTO> agregados = movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim);

        log.info("Relatório mensal gerado: período {} a {}, {} produto(s) com movimentação",
                dataInicio, dataFim, agregados.size());

        // Saldo final é o saldo acumulado do produto até dataFim (estoque real naquele momento),
        // não a diferença entre entradas e saídas só do período — por isso é uma consulta à parte.
        return agregados.stream()
                .map(agregado -> new RelatorioMensalItemDTO(
                        agregado.produtoId(),
                        agregado.produtoNome(),
                        agregado.quantidadeEntradas(),
                        agregado.quantidadeSaidas(),
                        agregado.quantidadeProducaoInterna(),
                        agregado.valorEntradas(),
                        movimentacaoRepository.calcularSaldoTotalAteData(agregado.produtoId(), dataFim)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportarRelatorioMensalPdf(LocalDate dataInicio, LocalDate dataFim) {
        List<RelatorioMensalItemDTO> itens = gerarRelatorioMensal(dataInicio, dataFim);

        try (PDDocument documento = new PDDocument()) {
            PDType1Font fonteNegrito = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fonteNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            float margemEsquerda = 50;
            float topo = 780;
            float alturaLinha = 15;

            PDPage pagina = new PDPage(PDRectangle.A4);
            documento.addPage(pagina);
            PDPageContentStream conteudo = new PDPageContentStream(documento, pagina);
            float y = topo;

            conteudo.setFont(fonteNegrito, 14);
            conteudo.beginText();
            conteudo.newLineAtOffset(margemEsquerda, y);
            conteudo.showText("Relatorio Mensal Consolidado (" + dataInicio + " a " + dataFim + ")");
            conteudo.endText();
            y -= 30;

            conteudo.setFont(fonteNegrito, 9);
            conteudo.beginText();
            conteudo.newLineAtOffset(margemEsquerda, y);
            conteudo.showText(formatarLinhaPdf("Produto", "Entradas", "Saidas", "Prod.Interna", "Valor", "Saldo Final"));
            conteudo.endText();
            y -= alturaLinha;

            conteudo.setFont(fonteNormal, 9);
            for (RelatorioMensalItemDTO item : itens) {
                if (y < 50) {
                    conteudo.close();
                    pagina = new PDPage(PDRectangle.A4);
                    documento.addPage(pagina);
                    conteudo = new PDPageContentStream(documento, pagina);
                    conteudo.setFont(fonteNormal, 9);
                    y = topo;
                }
                conteudo.beginText();
                conteudo.newLineAtOffset(margemEsquerda, y);
                conteudo.showText(formatarLinhaPdf(
                        item.produtoNome(),
                        item.quantidadeEntradas().toPlainString(),
                        item.quantidadeSaidas().toPlainString(),
                        item.quantidadeProducaoInterna().toPlainString(),
                        item.valorEntradas().toPlainString(),
                        item.saldoFinal().toPlainString()));
                conteudo.endText();
                y -= alturaLinha;
            }
            conteudo.close();

            ByteArrayOutputStream saida = new ByteArrayOutputStream();
            documento.save(saida);
            return saida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao gerar PDF do relatório mensal", e);
        }
    }

    // PDFBox (fontes padrão) não suporta caracteres acentuados sem embutir uma fonte TTF —
    // por isso o texto do PDF é sem acentuação. O Excel (abaixo) não tem essa limitação.
    private String formatarLinhaPdf(String produto, String entradas, String saidas, String producaoInterna,
            String valor, String saldoFinal) {
        return String.format("%-25s %-10s %-10s %-13s %-10s %-10s",
                produto, entradas, saidas, producaoInterna, valor, saldoFinal);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportarRelatorioMensalExcel(LocalDate dataInicio, LocalDate dataFim) {
        List<RelatorioMensalItemDTO> itens = gerarRelatorioMensal(dataInicio, dataFim);
        String[] colunas = { "Produto", "Entradas", "Saídas", "Produção Interna", "Valor Entradas", "Saldo Final" };

        try (XSSFWorkbook planilha = new XSSFWorkbook()) {
            Sheet aba = planilha.createSheet("Relatorio Mensal");

            Row linhaTitulo = aba.createRow(0);
            linhaTitulo.createCell(0)
                    .setCellValue("Relatório Mensal Consolidado (" + dataInicio + " a " + dataFim + ")");

            Row linhaCabecalho = aba.createRow(2);
            for (int coluna = 0; coluna < colunas.length; coluna++) {
                linhaCabecalho.createCell(coluna).setCellValue(colunas[coluna]);
            }

            int numeroLinha = 3;
            for (RelatorioMensalItemDTO item : itens) {
                Row linha = aba.createRow(numeroLinha++);
                linha.createCell(0).setCellValue(item.produtoNome());
                linha.createCell(1).setCellValue(item.quantidadeEntradas().doubleValue());
                linha.createCell(2).setCellValue(item.quantidadeSaidas().doubleValue());
                linha.createCell(3).setCellValue(item.quantidadeProducaoInterna().doubleValue());
                linha.createCell(4).setCellValue(item.valorEntradas().doubleValue());
                linha.createCell(5).setCellValue(item.saldoFinal().doubleValue());
            }

            for (int coluna = 0; coluna < colunas.length; coluna++) {
                aba.autoSizeColumn(coluna);
            }

            ByteArrayOutputStream saida = new ByteArrayOutputStream();
            planilha.write(saida);
            return saida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao gerar Excel do relatório mensal", e);
        }
    }
}
