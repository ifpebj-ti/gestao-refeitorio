package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.RelatorioMensalItemDTO;
import br.ifpe.gestaorefeitorio.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService relatorioService;

    // Só a NUTRICIONISTA acessa relatórios/gráficos (definido pelo cliente, US19/#160).
    @GetMapping("/mensal")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public List<RelatorioMensalItemDTO> relatorioMensal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return relatorioService.gerarRelatorioMensal(dataInicio, dataFim);
    }

    // Endpoint dedicado por formato (não um único endpoint genérico com parâmetro
    // "formato") — CLAUDE.md seção 9. Mesmo RBAC do relatório em JSON (US20/#163).
    @GetMapping("/mensal/pdf")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<byte[]> relatorioMensalPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        byte[] pdf = relatorioService.exportarRelatorioMensalPdf(dataInicio, dataFim);
        String nomeArquivo = "relatorio-mensal-" + dataInicio + "-a-" + dataFim + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + nomeArquivo)
                .body(pdf);
    }

    @GetMapping("/mensal/excel")
    @PreAuthorize("hasRole('NUTRICIONISTA')")
    public ResponseEntity<byte[]> relatorioMensalExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        byte[] excel = relatorioService.exportarRelatorioMensalExcel(dataInicio, dataFim);
        String nomeArquivo = "relatorio-mensal-" + dataInicio + "-a-" + dataFim + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + nomeArquivo)
                .body(excel);
    }
}
