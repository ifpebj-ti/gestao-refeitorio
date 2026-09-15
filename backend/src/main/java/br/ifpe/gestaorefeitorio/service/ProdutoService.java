package br.ifpe.gestaorefeitorio.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    public List<Produto> listarTodos() {
        return produtoRepository.findAll();
    }

    public Produto buscarPorId(UUID id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: " + id));
    }

    public Produto criar(Produto produto) {
        return produtoRepository.save(produto);
    }

    /**
     * Regra de negócio: unidade de medida pode ser alterada pelo nutricionista
     * (admin).
     */
    public Produto atualizarUnidadeMedida(UUID id, String novaUnidade) {
        Produto produto = buscarPorId(id);
        produto.setUnidadeMedida(novaUnidade);
        return produtoRepository.save(produto);
    }
}
