package br.ifpe.gestaorefeitorio.repository;

import br.ifpe.gestaorefeitorio.model.NotaLocalSequencia;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotaLocalSequenciaRepository extends JpaRepository<NotaLocalSequencia, Integer> {

    // Cria o contador do ano na primeira emissão; se outra emissão já criou, não faz nada (sem erro de chave).
    @Modifying
    @Query(value = "INSERT INTO nota_local_sequencias (ano, ultimo_numero) VALUES (:ano, 0) ON CONFLICT (ano) DO NOTHING",
            nativeQuery = true)
    void criarSeNaoExistir(@Param("ano") int ano);

    // SELECT ... FOR UPDATE: uma segunda emissão do mesmo ano espera a primeira terminar.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM NotaLocalSequencia s WHERE s.ano = :ano")
    Optional<NotaLocalSequencia> buscarParaAtualizar(@Param("ano") int ano);
}
