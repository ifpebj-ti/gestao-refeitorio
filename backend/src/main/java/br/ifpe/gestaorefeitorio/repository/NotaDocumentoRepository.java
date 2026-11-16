package br.ifpe.gestaorefeitorio.repository;

import br.ifpe.gestaorefeitorio.model.NotaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NotaDocumentoRepository extends JpaRepository<NotaDocumento, UUID> {

    Optional<NotaDocumento> findByNotaId(UUID notaId);

    boolean existsByNotaId(UUID notaId);
}
