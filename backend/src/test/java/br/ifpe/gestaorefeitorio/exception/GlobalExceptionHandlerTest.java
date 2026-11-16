package br.ifpe.gestaorefeitorio.exception;

import br.ifpe.gestaorefeitorio.model.Nota;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void deveResponder409ComMensagemGenericaEmAlteracaoConcorrente() {
        UUID id = UUID.randomUUID();
        ObjectOptimisticLockingFailureException ex = new ObjectOptimisticLockingFailureException(Nota.class, id);

        ResponseEntity<Map<String, Object>> resposta = handler.handleAlteracaoConcorrente(ex);

        assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        String mensagem = (String) resposta.getBody().get("mensagem");
        assertThat(mensagem).isEqualTo(
                "O registro foi alterado por outra operação ao mesmo tempo. Recarregue e tente novamente.");
        // A mensagem técnica (classe e chave do registro) não chega ao cliente.
        assertThat(mensagem).doesNotContain(id.toString()).doesNotContain("Nota");
    }
}
