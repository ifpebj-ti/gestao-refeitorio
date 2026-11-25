package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoSaidaRequestDTO;
import br.ifpe.gestaorefeitorio.exception.SaldoInsuficienteException;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoSaida;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Saídas simultâneas do mesmo produto e local (#475), com transações reais: somadas, elas passam do saldo,
 * e só as que cabem podem ser aceitas. Sem @Transactional de propósito, para cada saída comitar na sua
 * própria transação, como acontece com duas pessoas registrando ao mesmo tempo.
 */
@SpringBootTest
@Testcontainers
class SaidaConcorrenteIntegrationTest {

    private static final int SAIDAS_SIMULTANEAS = 8;
    private static final BigDecimal SALDO_INICIAL = new BigDecimal("5");
    private static final BigDecimal QUANTIDADE_POR_SAIDA = new BigDecimal("2");

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MovimentacaoService movimentacaoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    private Usuario cozinha;
    private Produto produto;
    private LocalArmazenamento local;

    @BeforeEach
    void setUp() {
        cozinha = new Usuario();
        cozinha.setNome("Cozinha");
        cozinha.setEmail("cozinha-" + UUID.randomUUID() + "@ifpe.edu.br");
        cozinha.setPerfil(Perfil.COZINHA);
        cozinha.setAtivo(true);
        cozinha = usuarioRepository.save(cozinha);

        produto = new Produto();
        produto.setNome("Arroz " + UUID.randomUUID());
        produto.setCategoria("Grãos");
        produto.setUnidadeMedida("kg");
        produto = produtoRepository.save(produto);

        local = new LocalArmazenamento();
        local.setNome("Despensa " + UUID.randomUUID());
        local = localArmazenamentoRepository.save(local);

        Movimentacao entrada = new Movimentacao();
        entrada.setProduto(produto);
        entrada.setLocal(local);
        entrada.setTipo(TipoMovimentacao.ENTRADA);
        entrada.setOrigem(OrigemMovimentacao.EXTERNA);
        entrada.setQuantidade(SALDO_INICIAL);
        entrada.setValor(new BigDecimal("25.00"));
        entrada.setData(LocalDate.now());
        entrada.setResponsavel(cozinha);
        movimentacaoRepository.save(entrada);
    }

    private void registrarSaida() {
        movimentacaoService.registrarSaida(new MovimentacaoSaidaRequestDTO(produto.getId(), local.getId(),
                QUANTIDADE_POR_SAIDA, LocalDate.now(), TipoSaida.CONSUMO), cozinha);
    }

    @Test
    void saidasSimultaneasNaoDevemDeixarOSaldoNegativo() throws Exception {
        // Todas as threads esperam o mesmo sinal para registrar ao mesmo tempo.
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(SAIDAS_SIMULTANEAS);
        List<Future<?>> saidas = new ArrayList<>();
        int aceitas = 0;
        int recusadasPorSaldo = 0;
        try {
            for (int i = 0; i < SAIDAS_SIMULTANEAS; i++) {
                saidas.add(executor.submit(() -> {
                    largada.await();
                    registrarSaida();
                    return null;
                }));
            }
            largada.countDown();

            for (Future<?> saida : saidas) {
                try {
                    saida.get(60, TimeUnit.SECONDS);
                    aceitas++;
                } catch (ExecutionException e) {
                    assertThat(e.getCause()).isInstanceOf(SaldoInsuficienteException.class);
                    recusadasPorSaldo++;
                }
            }
        } finally {
            executor.shutdownNow();
        }

        // Saldo 5 e saídas de 2: só duas cabem, e sobra 1.
        assertThat(aceitas).isEqualTo(2);
        assertThat(recusadasPorSaldo).isEqualTo(SAIDAS_SIMULTANEAS - 2);
        assertThat(movimentacaoRepository.calcularSaldo(produto.getId(), local.getId()))
                .isEqualByComparingTo("1");
    }
}
