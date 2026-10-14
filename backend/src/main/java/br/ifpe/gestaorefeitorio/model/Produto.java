package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "produtos")
@Getter
@Setter
@NoArgsConstructor
public class Produto {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String categoria;

    /** Unidade de medida (kg, L, un, etc). Editável pelo nutricionista. */
    @Column(nullable = false)
    private String unidadeMedida;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal saldoAtual = BigDecimal.ZERO;

    private BigDecimal valorReferencia;

    /** Usado pelo job de alerta de validade (principalmente para frios). */
    private Boolean controlaValidade = false;

    private Integer diasAlertaValidade;

    /** Definida manualmente pela NUTRICIONISTA. Usada pelo job de alerta de estoque baixo (US15). */
    @Column(precision = 12, scale = 3)
    private BigDecimal quantidadeMinima;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
