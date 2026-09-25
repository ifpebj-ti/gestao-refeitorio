package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.RelatorioMensalItemDTO;
import br.ifpe.gestaorefeitorio.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
}
