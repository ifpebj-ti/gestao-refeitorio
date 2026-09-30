package br.ifpe.gestaorefeitorio.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Tabela separada de Movimentacao (não coluna) pra não carregar esse join em toda consulta
// de estoque — mesmo padrão de MovimentacaoFoto. Relação 1:1 obrigatória: só existe quando
// a movimentação é, de fato, um recebimento de produção interna.
@Entity
@Table(name = "producoes_internas")
@Getter
@Setter
@NoArgsConstructor
public class ProducaoInterna {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(name = "movimentacao_id", unique = true, nullable = false)
    private Movimentacao movimentacao;

    @ManyToOne(optional = false)
    @JoinColumn(name = "setor_id")
    private SetorProdutivo setor;

    // Nome de quem entregou pelo setor produtivo — texto livre, não é um Usuario do sistema.
    @Column(nullable = false, length = 150)
    private String responsavelSetor;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();
}
