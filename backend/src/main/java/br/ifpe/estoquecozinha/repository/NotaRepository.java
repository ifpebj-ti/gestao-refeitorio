package br.ifpe.estoquecozinha.repository;

import br.ifpe.estoquecozinha.model.Nota;
import br.ifpe.estoquecozinha.model.enums.StatusNota;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotaRepository extends JpaRepository<Nota, UUID> {
    List<Nota> findByStatus(StatusNota status);
}
