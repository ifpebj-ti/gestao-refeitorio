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
import br.ifpe.gestaorefeitorio.model.enums.TipoSaida;

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

    /** Obrigatório só em ENTRADA, nulo em SAIDA — CLAUDE.md seção 13.3/4. */
    @Enumerated(EnumType.STRING)
    private OrigemMovimentacao origem;

    /** Obrigatório só em SAIDA (CONSUMO/PERDA/DESCARTE/OUTRO), nulo em ENTRADA. */
    @Enumerated(EnumType.STRING)
    private TipoSaida tipoSaida;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidade;

    /** Valor de compra — só faz sentido em ENTRADA, nulo em SAIDA. */
    @Column(precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate data;

    /** Data de validade do lote recebido, quando aplicável (entradas). */
    private LocalDate dataValidade;

    @ManyToOne(optional = false)
    @JoinColumn(name = "responsavel_id")
    private Usuario responsavel;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
