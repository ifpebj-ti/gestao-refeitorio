package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import br.ifpe.gestaorefeitorio.model.enums.StatusNota;

@Entity
@Table(name = "notas")
@Getter
@Setter
@NoArgsConstructor
public class Nota {

    @Id
    @GeneratedValue
    private UUID id;

    // Único por remetente (UNIQUE (remetente_id, numero) da V23), não globalmente.
    @Column(nullable = false, length = 50)
    private String numero;

    @Column(nullable = false)
    private LocalDate data;

    @ManyToOne(optional = false)
    @JoinColumn(name = "remetente_id")
    private Remetente remetente;

    /** Entradas comprovadas pela nota; produto, quantidade, lote e local vêm delas. */
    @ManyToMany
    @JoinTable(name = "nota_movimentacoes",
            joinColumns = @JoinColumn(name = "nota_id"),
            inverseJoinColumns = @JoinColumn(name = "movimentacao_id"))
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private List<Movimentacao> movimentacoes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusNota status = StatusNota.PENDENTE;

    @Column(length = 500)
    private String observacoes;

    /** Preenchido quando o nutricionista valida ou recusa. */
    private String justificativaRecusa;

    @ManyToOne(optional = false)
    @JoinColumn(name = "registrado_por_id")
    private Usuario registradoPor;

    @ManyToOne
    @JoinColumn(name = "validado_por_id")
    private Usuario validadoPor;

    private Instant validadoEm;

    private String documentoUrl;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    public List<Movimentacao> getMovimentacoes() {
        return Collections.unmodifiableList(movimentacoes);
    }

    // Altera a própria lista em vez de trocá-la: o Hibernate rastreia essa instância da @ManyToMany.
    public void substituirMovimentacoes(List<Movimentacao> entradas) {
        movimentacoes.clear();
        movimentacoes.addAll(entradas);
    }
}
