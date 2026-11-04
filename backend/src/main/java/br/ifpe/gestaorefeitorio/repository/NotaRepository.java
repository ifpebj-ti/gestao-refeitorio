package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;

import java.util.List;
import java.util.UUID;

public interface NotaRepository extends JpaRepository<Nota, UUID> {
    List<Nota> findByStatus(StatusNota status);

    boolean existsByRemetenteIdAndNumero(UUID remetenteId, String numero);

    @Query("""
            SELECT COUNT(n) > 0 FROM Nota n JOIN n.movimentacoes m
            WHERE m.id = :movimentacaoId
            """)
    boolean existsByMovimentacaoId(@Param("movimentacaoId") UUID movimentacaoId);
}
