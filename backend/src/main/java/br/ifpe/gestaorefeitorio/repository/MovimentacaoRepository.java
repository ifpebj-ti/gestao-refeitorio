package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.Movimentacao;

import java.util.UUID;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID> {
}
