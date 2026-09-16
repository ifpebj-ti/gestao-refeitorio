package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;

import java.util.Optional;
import java.util.UUID;

public interface LocalArmazenamentoRepository extends JpaRepository<LocalArmazenamento, UUID> {
    Optional<LocalArmazenamento> findByNome(String nome);
}
