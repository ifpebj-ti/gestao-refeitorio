package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "locais_armazenamento")
@Getter
@Setter
@NoArgsConstructor
public class LocalArmazenamento {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nome;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
