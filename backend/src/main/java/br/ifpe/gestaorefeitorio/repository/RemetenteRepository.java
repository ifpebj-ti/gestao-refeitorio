package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.Remetente;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RemetenteRepository extends JpaRepository<Remetente, UUID> {
    Optional<Remetente> findByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, UUID id);

    List<Remetente> findByAtivo(boolean ativo, Sort sort);
}
