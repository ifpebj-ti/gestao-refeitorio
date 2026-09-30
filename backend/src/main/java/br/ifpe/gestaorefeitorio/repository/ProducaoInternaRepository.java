package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.ProducaoInterna;

import java.util.List;
import java.util.UUID;

public interface ProducaoInternaRepository extends JpaRepository<ProducaoInterna, UUID> {
    List<ProducaoInterna> findByMovimentacaoIdIn(List<UUID> movimentacaoIds);
}
