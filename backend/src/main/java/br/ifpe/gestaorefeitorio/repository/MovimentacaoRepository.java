package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.ifpe.gestaorefeitorio.dto.SaldoPorLocalDTO;
import br.ifpe.gestaorefeitorio.model.Movimentacao;

import java.math.BigDecimal;
import java.util.List;
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

    // Mesmo cálculo, somando todos os locais (US10/#94 — saldo total do produto).
    @Query("""
            select coalesce(sum(case when m.tipo = br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao.ENTRADA
                                      then m.quantidade else -m.quantidade end), 0)
            from Movimentacao m
            where m.produto.id = :produtoId
            """)
    BigDecimal calcularSaldoTotal(@Param("produtoId") UUID produtoId);

    // Só retorna locais onde o produto já teve alguma movimentação (saldo zero é implícito
    // pra qualquer outro local).
    @Query("""
            select new br.ifpe.gestaorefeitorio.dto.SaldoPorLocalDTO(m.local.id, m.local.nome,
                    sum(case when m.tipo = br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao.ENTRADA
                             then m.quantidade else -m.quantidade end))
            from Movimentacao m
            where m.produto.id = :produtoId
            group by m.local.id, m.local.nome
            """)
    List<SaldoPorLocalDTO> listarSaldoPorLocal(@Param("produtoId") UUID produtoId);
}
