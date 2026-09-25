package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.RelatorioMensalItemDTO;

import java.time.LocalDate;
import java.util.List;

public interface RelatorioService {
    List<RelatorioMensalItemDTO> gerarRelatorioMensal(LocalDate dataInicio, LocalDate dataFim);

    byte[] exportarRelatorioMensalPdf(LocalDate dataInicio, LocalDate dataFim);

    byte[] exportarRelatorioMensalExcel(LocalDate dataInicio, LocalDate dataFim);
}
