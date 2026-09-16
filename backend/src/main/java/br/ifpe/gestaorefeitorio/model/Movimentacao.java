package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;

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

    @ManyToOne(optional = false)
    @JoinColumn(name = "local_id")
    private LocalArmazenamento local;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMovimentacao tipo;

    /**
     * De onde veio o produto de uma ENTRADA (EXTERNA/AGROINDUSTRIA/INTERNA).
     * Não confundir com tipo_saida (CONSUMO/PERDA/DESCARTE/OUTRO), que é um campo
     * separado da US09/saída, ainda não implementado.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrigemMovimentacao origem;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidade;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

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
