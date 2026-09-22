package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.ifpe.gestaorefeitorio.model.Produto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    List<Produto> findByCategoriaIgnoreCase(String categoria);

    // Base para o job de alerta: produtos cujas movimentações de entrada
    // tenham validade dentro da janela de alerta configurada.
    @org.springframework.data.jpa.repository.Query("""
            select distinct p from Produto p
            join Movimentacao m on m.produto = p
            where p.controlaValidade = true
              and m.dataValidade is not null
              and m.dataValidade <= :limite
            """)
    List<Produto> buscarComValidadeProxima(LocalDate limite);
}
