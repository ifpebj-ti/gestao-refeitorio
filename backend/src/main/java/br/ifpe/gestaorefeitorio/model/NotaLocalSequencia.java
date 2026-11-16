package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Último número de nota local emitido em cada ano (NL-AAAA-NNNN, US33/#293). */
@Entity
@Table(name = "nota_local_sequencias")
@Getter
@Setter
@NoArgsConstructor
public class NotaLocalSequencia {

    @Id
    private Integer ano;

    @Column(nullable = false)
    private Integer ultimoNumero;
}
