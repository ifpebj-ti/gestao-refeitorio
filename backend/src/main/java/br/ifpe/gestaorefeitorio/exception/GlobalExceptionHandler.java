package br.ifpe.gestaorefeitorio.exception;

import br.ifpe.gestaorefeitorio.model.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidacao(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(erro -> erros.put(erro.getField(), erro.getDefaultMessage()));
        Map<String, Object> corpo = corpo("Dados inválidos");
        corpo.put("erros", erros);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo);
    }

    @ExceptionHandler(TokenGoogleInvalidoException.class)
    public ResponseEntity<Map<String, Object>> handleTokenInvalido(TokenGoogleInvalidoException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(corpo(ex.getMessage()));
    }

    @ExceptionHandler({ UsuarioNaoEncontradoException.class, UsuarioInativoException.class })
    public ResponseEntity<Map<String, Object>> handleAcessoNegado(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(corpo(ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAcessoNegadoPorPerfil(HttpServletRequest request) {
        log.info("Acesso negado por perfil insuficiente: {} para {} {}",
                obterEmailAutenticado(), request.getMethod(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(corpo("Acesso negado para o perfil atual"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo(ex.getMessage()));
    }

    @ExceptionHandler({ UsuarioNaoEncontradoPorIdException.class, ProdutoNaoEncontradoException.class,
            LocalArmazenamentoNaoEncontradoException.class, MovimentacaoNaoEncontradaException.class,
            MovimentacaoFotoNaoEncontradaException.class })
    public ResponseEntity<Map<String, Object>> handleNaoEncontradoPorId(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo(ex.getMessage()));
    }

    @ExceptionHandler({ EmailJaCadastradoException.class, AutoDesativacaoNaoPermitidaException.class,
            SaldoInsuficienteException.class })
    public ResponseEntity<Map<String, Object>> handleConflito(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo(ex.getMessage()));
    }

    @ExceptionHandler({ ArquivoInvalidoException.class, MaxUploadSizeExceededException.class })
    public ResponseEntity<Map<String, Object>> handleArquivoInvalido(Exception ex) {
        String mensagem = ex instanceof MaxUploadSizeExceededException
                ? "Arquivo excede o tamanho máximo permitido"
                : ex.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpo(mensagem));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(corpo("Erro interno"));
    }

    private Map<String, Object> corpo(String mensagem) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("timestamp", Instant.now().toString());
        corpo.put("mensagem", mensagem);
        return corpo;
    }

    private String obterEmailAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Usuario usuario) {
            return usuario.getEmail();
        }
        return "desconhecido";
    }
}
