package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.ProdutoRequestDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoResponseDTO;
import br.ifpe.gestaorefeitorio.dto.ProdutoUnidadeMedidaDTO;
import br.ifpe.gestaorefeitorio.exception.ProdutoNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProdutoServiceImpl implements ProdutoService {

    private final ProdutoRepository produtoRepository;

    @Override
    public ProdutoResponseDTO cadastrar(ProdutoRequestDTO request) {
        Produto produto = new Produto();
        produto.setNome(request.nome());
        produto.setCategoria(request.categoria());
        produto.setUnidadeMedida(request.unidadeMedida());
        produto.setValorReferencia(request.valorReferencia());
        produto = produtoRepository.save(produto);

        log.info("Produto cadastrado: {} ({})", produto.getNome(), produto.getCategoria());
        return paraDTO(produto);
    }

    @Override
    public List<ProdutoResponseDTO> listarTodos() {
        return produtoRepository.findAll().stream()
                .map(this::paraDTO)
                .toList();
    }

    @Override
    public List<ProdutoResponseDTO> listarPorCategoria(String categoria) {
        return produtoRepository.findByCategoriaIgnoreCase(categoria).stream()
                .map(this::paraDTO)
                .toList();
    }

    @Override
    public ProdutoResponseDTO buscarPorId(UUID id) {
        return paraDTO(buscarEntidade(id));
    }

    @Override
    public ProdutoResponseDTO atualizarUnidadeMedida(UUID id, ProdutoUnidadeMedidaDTO request, Usuario responsavel) {
        Produto produto = buscarEntidade(id);
        String unidadeAnterior = produto.getUnidadeMedida();
        produto.setUnidadeMedida(request.unidadeMedida());
        produto = produtoRepository.save(produto);

        log.info("Unidade de medida alterada: produto {} ({}), {} -> {}, por {}",
                produto.getId(), produto.getNome(), unidadeAnterior, produto.getUnidadeMedida(),
                responsavel.getEmail());

        return paraDTO(produto);
    }

    private Produto buscarEntidade(UUID id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ProdutoNaoEncontradoException(id));
    }

    private ProdutoResponseDTO paraDTO(Produto produto) {
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getCategoria(),
                produto.getUnidadeMedida(),
                produto.getValorReferencia());
    }
}
