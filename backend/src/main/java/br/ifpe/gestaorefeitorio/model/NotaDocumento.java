package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Tabela separada de Nota (não uma coluna) pra não carregar o blob nas consultas de nota.
// Relação 1:1 opcional, mesma decisão de MovimentacaoFoto (US28/#290).
@Entity
@Table(name = "nota_documentos")
@Getter
@Setter
@NoArgsConstructor
public class NotaDocumento {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(name = "nota_id", unique = true, nullable = false)
    private Nota nota;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] conteudo;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private Long tamanhoBytes;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
