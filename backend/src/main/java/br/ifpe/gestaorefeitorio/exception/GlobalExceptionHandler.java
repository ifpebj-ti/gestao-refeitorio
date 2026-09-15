package br.ifpe.gestaorefeitorio.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

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

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo(ex.getMessage()));
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
}
