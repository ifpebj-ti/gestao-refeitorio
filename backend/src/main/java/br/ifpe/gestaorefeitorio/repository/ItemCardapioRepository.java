package br.ifpe.gestaorefeitorio.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.ifpe.gestaorefeitorio.dto.ProjecaoConsumoDTO;
import br.ifpe.gestaorefeitorio.model.ItemCardapio;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ItemCardapioRepository extends JpaRepository<ItemCardapio, UUID> {
    List<ItemCardapio> findByCardapioId(UUID cardapioId);

    // Consolida todos os cardápios do período, somando por produto a quantidade estimada
    // (quantidadePorPessoa * pessoasEstimadas de cada cardápio) — US18/#157.
    @Query("""
            select new br.ifpe.gestaorefeitorio.dto.ProjecaoConsumoDTO(i.produto.id, i.produto.nome,
                    sum(i.quantidadePorPessoa * i.cardapio.pessoasEstimadas))
            from ItemCardapio i
            where i.cardapio.data between :dataInicio and :dataFim
            group by i.produto.id, i.produto.nome
            """)
    List<ProjecaoConsumoDTO> projetarConsumoPorPeriodo(
            @Param("dataInicio") LocalDate dataInicio, @Param("dataFim") LocalDate dataFim);
}
