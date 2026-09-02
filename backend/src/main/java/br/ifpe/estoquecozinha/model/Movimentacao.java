package br.ifpe.estoquecozinha.model;

import br.ifpe.estoquecozinha.model.enums.TipoMovimentacao;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "movimentacoes")
@Getter
@Setter
@NoArgsConstructor
public class Movimentacao {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMovimentacao tipo;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidade;

    @Column(nullable = false)
    private LocalDate data;

    /** Data de validade do lote recebido, quando aplicável (entradas). */
    private LocalDate dataValidade;

    /** URL da foto anexada (opcional) no storage de arquivos. */
    private String fotoUrl;

    @ManyToOne(optional = false)
    @JoinColumn(name = "responsavel_id")
    private Usuario responsavel;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
