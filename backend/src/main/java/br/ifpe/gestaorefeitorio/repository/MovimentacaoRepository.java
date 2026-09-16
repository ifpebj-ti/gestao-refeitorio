package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.ifpe.gestaorefeitorio.model.Movimentacao;

import java.math.BigDecimal;
import java.util.UUID;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID> {

    // Saldo é sempre derivado das movimentações (entradas - saídas) por produto e por
    // local, nunca um campo armazenado — CLAUDE.md seção 5.
    @Query("""
            select coalesce(sum(case when m.tipo = br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao.ENTRADA
                                      then m.quantidade else -m.quantidade end), 0)
            from Movimentacao m
            where m.produto.id = :produtoId and m.local.id = :localId
            """)
    BigDecimal calcularSaldo(@Param("produtoId") UUID produtoId, @Param("localId") UUID localId);
}
