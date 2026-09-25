package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.Produto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    List<Produto> findByCategoriaIgnoreCase(String categoria);

    // Base para o job de alerta (US16/#151): todo produto com validade próxima entra no
    // alerta, independente da categoria — controlaValidade só define destaque/prioridade
    // maior (produtos "frio"), não é mais um filtro de exclusão.
    @org.springframework.data.jpa.repository.Query("""
            select distinct p from Produto p
            join Movimentacao m on m.produto = p
            where m.dataValidade is not null
              and m.dataValidade <= :limite
            """)
    List<Produto> buscarComValidadeProxima(LocalDate limite);

    // Base para o job de alerta de estoque baixo (US15/#148): saldo total do produto (soma de
    // todos os locais, CLAUDE.md seção 4 — quantidadeMinima é atributo do produto, não do local)
    // menor ou igual à quantidade mínima configurada manualmente.
    @org.springframework.data.jpa.repository.Query("""
            select p from Produto p
            where p.quantidadeMinima is not null
              and coalesce((select sum(case when m.tipo = br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao.ENTRADA
                                             then m.quantidade else -m.quantidade end)
                            from Movimentacao m
                            where m.produto = p), 0) <= p.quantidadeMinima
            """)
    List<Produto> buscarComEstoqueBaixo();
}
