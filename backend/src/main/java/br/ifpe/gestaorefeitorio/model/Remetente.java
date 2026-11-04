package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "remetentes")
@Getter
@Setter
@NoArgsConstructor
public class Remetente {

    @Id
    @GeneratedValue
    private UUID id;

    // A unicidade é por LOWER(nome), garantida pelo índice da V22.
    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 14)
    private String documento;

    @Column(length = 150)
    private String contato;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
