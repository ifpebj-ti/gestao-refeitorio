package br.ifpe.estoquecozinha.repository;

import br.ifpe.estoquecozinha.model.Movimentacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID> {
}
