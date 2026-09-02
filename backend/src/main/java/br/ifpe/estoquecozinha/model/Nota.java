package br.ifpe.estoquecozinha.model;

import br.ifpe.estoquecozinha.model.enums.StatusNota;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "notas")
@Getter
@Setter
@NoArgsConstructor
public class Nota {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(nullable = false)
    private LocalDate data;

    private String origem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusNota status = StatusNota.PENDENTE;

    /** Preenchido quando o nutricionista valida ou recusa. */
    private String justificativaRecusa;

    @ManyToOne
    @JoinColumn(name = "validado_por_id")
    private Usuario validadoPor;

    private Instant validadoEm;

    private String documentoUrl;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
