package br.ifpe.gestaorefeitorio.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class DefinirSenhaRequestDTOTest {

    private static ValidatorFactory fabrica;
    private static Validator validator;

    @BeforeAll
    static void criarValidator() {
        fabrica = Validation.buildDefaultValidatorFactory();
        validator = fabrica.getValidator();
    }

    @AfterAll
    static void fecharValidator() {
        fabrica.close();
    }

    private Set<String> mensagens(String senha) {
        Set<ConstraintViolation<DefinirSenhaRequestDTO>> violacoes =
                validator.validate(new DefinirSenhaRequestDTO(senha));
        return violacoes.stream().map(ConstraintViolation::getMessage)
                .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    void deveRecusarSenhaComMenosDe12Caracteres() {
        assertThat(mensagens("a".repeat(11))).containsExactly("senha precisa ter pelo menos 12 caracteres");
    }

    @Test
    void deveAceitarSenhaCom12Caracteres() {
        assertThat(mensagens("a".repeat(12))).isEmpty();
    }

    @Test
    void deveRecusarSenhaAcimaDe72BytesMesmoComPoucosCaracteres() {
        // 37 caracteres acentuados ocupam 74 bytes em UTF-8.
        assertThat(mensagens("á".repeat(37))).containsExactly("senha não pode passar de 72 bytes");
    }

    @Test
    void deveRecusarSenhaVazia() {
        assertThat(mensagens(null)).contains("senha é obrigatória");
    }
}
