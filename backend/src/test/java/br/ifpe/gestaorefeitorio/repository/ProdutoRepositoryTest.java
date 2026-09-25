package br.ifpe.gestaorefeitorio.repository;

import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;

/**
 * Cobre os critérios de aceite da #148 (US15 — alerta de estoque baixo) e da
 * #151 (US16 — alerta de validade com prioridade para frios) nas queries de
 * saldo baixo e validade próxima do ProdutoRepository.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Testcontainers
class ProdutoRepositoryTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Produto criarProduto(String nome, BigDecimal quantidadeMinima) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        produto.setQuantidadeMinima(quantidadeMinima);
        return produtoRepository.save(produto);
    }

    private Produto criarProdutoComControlaValidade(String nome, boolean controlaValidade) {
        Produto produto = new Produto();
        produto.setNome(nome);
        produto.setCategoria("Frios");
        produto.setUnidadeMedida("un");
        produto.setControlaValidade(controlaValidade);
        return produtoRepository.save(produto);
    }

    private LocalArmazenamento criarLocal() {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Local " + UUID.randomUUID());
        return localArmazenamentoRepository.save(local);
    }

    private Usuario criarUsuario() {
        Usuario usuario = new Usuario();
        usuario.setNome("Cozinha");
        usuario.setEmail("cozinha-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(Perfil.COZINHA);
        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }

    private void registrarEntrada(Produto produto, LocalArmazenamento local, Usuario responsavel, String quantidade) {
        registrarEntrada(produto, local, responsavel, quantidade, null);
    }

    private void registrarEntrada(Produto produto, LocalArmazenamento local, Usuario responsavel, String quantidade,
            LocalDate dataValidade) {
        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setOrigem(OrigemMovimentacao.EXTERNA);
        movimentacao.setQuantidade(new BigDecimal(quantidade));
        movimentacao.setValor(new BigDecimal("10.00"));
        movimentacao.setData(LocalDate.now());
        movimentacao.setDataValidade(dataValidade);
        movimentacao.setResponsavel(responsavel);
        movimentacaoRepository.save(movimentacao);
    }

    @Test
    void deveEncontrarProdutoComEstoqueBaixoQuandoSaldoIgualQuantidadeMinima() {
        Produto produto = criarProduto("Arroz", new BigDecimal("5"));
        LocalArmazenamento local = criarLocal();
        Usuario responsavel = criarUsuario();
        registrarEntrada(produto, local, responsavel, "5");

        List<Produto> resultado = produtoRepository.buscarComEstoqueBaixo();

        assertThat(resultado).extracting(Produto::getId).contains(produto.getId());
    }

    @Test
    void naoDeveEncontrarProdutoSemQuantidadeMinimaConfigurada() {
        // Sem nenhuma movimentação — saldo zero, mas quantidadeMinima é nula (não configurada).
        Produto produto = criarProduto("Feijão", null);

        List<Produto> resultado = produtoRepository.buscarComEstoqueBaixo();

        assertThat(resultado).extracting(Produto::getId).doesNotContain(produto.getId());
    }

    @Test
    void naoDeveEncontrarProdutoComSaldoAcimaDaQuantidadeMinima() {
        Produto produto = criarProduto("Óleo", new BigDecimal("5"));
        LocalArmazenamento local = criarLocal();
        Usuario responsavel = criarUsuario();
        registrarEntrada(produto, local, responsavel, "20");

        List<Produto> resultado = produtoRepository.buscarComEstoqueBaixo();

        assertThat(resultado).extracting(Produto::getId).doesNotContain(produto.getId());
    }

    @Test
    void deveEncontrarProdutoComValidadeProximaMesmoSemControlarValidade() {
        Produto produto = criarProdutoComControlaValidade("Alface", false);
        LocalArmazenamento local = criarLocal();
        Usuario responsavel = criarUsuario();
        registrarEntrada(produto, local, responsavel, "10", LocalDate.now().plusDays(1));

        List<Produto> resultado = produtoRepository.buscarComValidadeProxima(LocalDate.now().plusDays(3));

        assertThat(resultado).extracting(Produto::getId).contains(produto.getId());
    }

    @Test
    void deveEncontrarProdutoComValidadeProximaQuandoControlaValidade() {
        Produto produto = criarProdutoComControlaValidade("Iogurte", true);
        LocalArmazenamento local = criarLocal();
        Usuario responsavel = criarUsuario();
        registrarEntrada(produto, local, responsavel, "10", LocalDate.now().plusDays(1));

        List<Produto> resultado = produtoRepository.buscarComValidadeProxima(LocalDate.now().plusDays(3));

        assertThat(resultado).extracting(Produto::getId).contains(produto.getId());
    }

    @Test
    void naoDeveEncontrarProdutoSemDataValidadeOuForaDaJanela() {
        Produto semValidade = criarProdutoComControlaValidade("Queijo", true);
        Produto validadeDistante = criarProdutoComControlaValidade("Carne", true);
        LocalArmazenamento local = criarLocal();
        Usuario responsavel = criarUsuario();
        registrarEntrada(semValidade, local, responsavel, "10");
        registrarEntrada(validadeDistante, local, responsavel, "10", LocalDate.now().plusDays(30));

        List<Produto> resultado = produtoRepository.buscarComValidadeProxima(LocalDate.now().plusDays(3));

        assertThat(resultado).extracting(Produto::getId)
                .doesNotContain(semValidade.getId(), validadeDistante.getId());
    }
}
