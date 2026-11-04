package br.ifpe.gestaorefeitorio.repository;

import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Nota;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Consultas de movimentação com filtros opcionais. Specification em vez de {@code @Query} com
 * {@code (:param IS NULL OR ...)}: o Postgres não infere o tipo de parâmetro nulo (vira bytea
 * em LOWER/LIKE e "could not determine data type" em datas). Aqui só os filtros informados
 * entram na consulta, e todos os valores continuam como parâmetros.
 */
public final class MovimentacaoSpecifications {

    private MovimentacaoSpecifications() {
    }

    /**
     * Entradas sem vínculo com nenhuma nota (de qualquer status, inclusive CANCELADA). Filtros nulos
     * não são aplicados; {@code fornecedorPadrao} já vem pronto para o LIKE, com '\' como escape.
     */
    public static Specification<Movimentacao> entradasDisponiveis(LocalDate dataInicio, LocalDate dataFim,
                                                                  UUID produtoId, String fornecedorPadrao) {
        return (root, query, cb) -> {
            // Fetch só na consulta de dados; numa consulta de contagem o fetch é inválido.
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("produto");
                root.fetch("local");
            }

            List<Predicate> predicados = new ArrayList<>();
            predicados.add(cb.equal(root.get("tipo"), TipoMovimentacao.ENTRADA));

            Subquery<Integer> vinculo = query.subquery(Integer.class);
            Root<Nota> nota = vinculo.from(Nota.class);
            Join<Nota, Movimentacao> vinculada = nota.join("movimentacoes");
            vinculo.select(cb.literal(1)).where(cb.equal(vinculada.get("id"), root.get("id")));
            predicados.add(cb.not(cb.exists(vinculo)));

            if (dataInicio != null) {
                predicados.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("data"), dataInicio));
            }
            if (dataFim != null) {
                predicados.add(cb.lessThanOrEqualTo(root.<LocalDate>get("data"), dataFim));
            }
            if (produtoId != null) {
                predicados.add(cb.equal(root.get("produto").get("id"), produtoId));
            }
            if (fornecedorPadrao != null) {
                // LOWER dos dois lados para o banco tratar acento e caixa do mesmo jeito no texto e no padrão.
                predicados.add(cb.like(cb.lower(root.<String>get("fornecedor")),
                        cb.lower(cb.literal(fornecedorPadrao)), '\\'));
            }
            return cb.and(predicados.toArray(Predicate[]::new));
        };
    }
}
