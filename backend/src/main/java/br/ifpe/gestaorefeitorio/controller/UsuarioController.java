package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.dto.UsuarioEdicaoDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioResponseDTO;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> cadastrar(@Valid @RequestBody UsuarioRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.cadastrar(request));
    }

    @GetMapping
    public List<UsuarioResponseDTO> listar() {
        return usuarioService.listarTodos();
    }

    @GetMapping("/{id}")
    public UsuarioResponseDTO buscar(@PathVariable UUID id) {
        return usuarioService.buscarPorId(id);
    }

    @PatchMapping("/{id}")
    public UsuarioResponseDTO editar(@PathVariable UUID id, @Valid @RequestBody UsuarioEdicaoDTO request) {
        return usuarioService.editar(id, request);
    }

    @PatchMapping("/{id}/desativar")
    public UsuarioResponseDTO desativar(@PathVariable UUID id, @AuthenticationPrincipal Usuario adminAutenticado) {
        return usuarioService.desativar(id, adminAutenticado);
    }
}
