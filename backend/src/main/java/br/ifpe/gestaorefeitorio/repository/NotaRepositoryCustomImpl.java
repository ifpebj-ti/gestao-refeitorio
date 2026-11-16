package br.ifpe.gestaorefeitorio.repository;

import br.ifpe.gestaorefeitorio.dto.NotaResumoDTO;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.NotaDocumento;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.enums.StatusNota;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Criteria em vez de {@code @Query} com {@code (:param IS NULL OR ...)}: com parâmetro nulo o Postgres não
 * infere o tipo (mesmo motivo de {@link MovimentacaoSpecifications}). Só os filtros informados entram, todos
 * como parâmetros. A projeção monta o DTO direto, sem carregar a nota, as entradas nem o arquivo do documento.
 */
public class NotaRepositoryCustomImpl implements NotaRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<NotaResumoDTO> listarResumos(StatusNota status, UUID remetenteId,
                                             LocalDate dataInicio, LocalDate dataFim) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<NotaResumoDTO> query = cb.createQuery(NotaResumoDTO.class);
        Root<Nota> nota = query.from(Nota.class);
        Join<Nota, Remetente> remetente = nota.join("remetente");

        Subquery<Long> quantidadeEntradas = query.subquery(Long.class);
        Root<Nota> notaDaContagem = quantidadeEntradas.correlate(nota);
        Join<Nota, Movimentacao> entrada = notaDaContagem.join("movimentacoes");
        quantidadeEntradas.select(cb.count(entrada));

        Subquery<Integer> documento = query.subquery(Integer.class);
        Root<NotaDocumento> notaDocumento = documento.from(NotaDocumento.class);
        documento.select(cb.literal(1)).where(cb.equal(notaDocumento.get("nota"), nota));

        query.select(cb.construct(NotaResumoDTO.class,
                nota.get("id"),
                nota.get("numero"),
                nota.get("data"),
                remetente.get("nome"),
                nota.get("status"),
                quantidadeEntradas,
                cb.<Boolean>selectCase().when(cb.exists(documento), true).otherwise(false)));

        List<Predicate> filtros = new ArrayList<>();
        if (status != null) {
            filtros.add(cb.equal(nota.get("status"), status));
        }
        if (remetenteId != null) {
            filtros.add(cb.equal(remetente.get("id"), remetenteId));
        }
        if (dataInicio != null) {
            filtros.add(cb.greaterThanOrEqualTo(nota.get("data"), dataInicio));
        }
        if (dataFim != null) {
            filtros.add(cb.lessThanOrEqualTo(nota.get("data"), dataFim));
        }
        query.where(filtros.toArray(Predicate[]::new));
        // criadoEm desempata notas da mesma data, para a ordem ser sempre a mesma.
        query.orderBy(cb.asc(nota.get("data")), cb.asc(nota.get("criadoEm")));

        return entityManager.createQuery(query).getResultList();
    }
}
