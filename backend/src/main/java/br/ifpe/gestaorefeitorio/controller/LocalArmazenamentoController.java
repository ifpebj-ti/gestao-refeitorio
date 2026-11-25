package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.LocalArmazenamentoResponseDTO;
import br.ifpe.gestaorefeitorio.service.LocalArmazenamentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Sem @PreAuthorize: qualquer perfil autenticado lista os locais, que o front usa nas telas de movimentação (#473).
@RestController
@RequestMapping("/api/locais-armazenamento")
@RequiredArgsConstructor
public class LocalArmazenamentoController {

    private final LocalArmazenamentoService localArmazenamentoService;

    @GetMapping
    public List<LocalArmazenamentoResponseDTO> listar() {
        return localArmazenamentoService.listar();
    }
}
