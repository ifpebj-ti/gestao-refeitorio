package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Tabela separada de Movimentacao (não uma coluna) pra não carregar o blob em toda
// consulta de listagem/histórico. Relação 1:1 opcional — nem toda movimentação tem foto.
@Entity
@Table(name = "movimentacao_fotos")
@Getter
@Setter
@NoArgsConstructor
public class MovimentacaoFoto {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(name = "movimentacao_id", unique = true, nullable = false)
    private Movimentacao movimentacao;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] conteudo;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private Long tamanhoBytes;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
