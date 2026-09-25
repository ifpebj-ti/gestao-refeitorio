package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.ItemCardapio;

import java.util.List;
import java.util.UUID;

public interface ItemCardapioRepository extends JpaRepository<ItemCardapio, UUID> {
    List<ItemCardapio> findByCardapioId(UUID cardapioId);
}
