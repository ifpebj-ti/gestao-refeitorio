package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cardapios")
@Getter
@Setter
@NoArgsConstructor
public class Cardapio {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 100)
    private String refeicao;

    @Column(nullable = false)
    private LocalDate data;

    @Column(nullable = false)
    private Integer pessoasEstimadas;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
