package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.Cardapio;

import java.util.UUID;

public interface CardapioRepository extends JpaRepository<Cardapio, UUID> {
}
