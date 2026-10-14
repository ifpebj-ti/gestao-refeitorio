package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.SetorProdutivo;

import java.util.Optional;
import java.util.UUID;

public interface SetorProdutivoRepository extends JpaRepository<SetorProdutivo, UUID> {
    Optional<SetorProdutivo> findByNomeIgnoreCase(String nome);
}
