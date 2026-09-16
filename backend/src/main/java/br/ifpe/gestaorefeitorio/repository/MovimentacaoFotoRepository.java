package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.MovimentacaoFoto;

import java.util.Optional;
import java.util.UUID;

public interface MovimentacaoFotoRepository extends JpaRepository<MovimentacaoFoto, UUID> {
    Optional<MovimentacaoFoto> findByMovimentacaoId(UUID movimentacaoId);
}
