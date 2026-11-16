package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.NotaLocalRequestDTO;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Numeração da nota local (US33/#293) com transações reais: emissões simultâneas não repetem nem pulam
 * número, e a sequência recomeça no ano seguinte. Sem @Transactional de propósito, para cada emissão
 * comitar na sua própria transação; o relógio fixa anos sem uso (2031 e 2032) para o resultado ser exato.
 */
@SpringBootTest
@Testcontainers
class NotaLocalSequenciaIntegrationTest {

    private static final int EMISSOES_SIMULTANEAS = 5;

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @MockitoBean
    private Clock clock;

    @Autowired
    private NotaService notaService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RemetenteRepository remetenteRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    private Usuario nutricionista;
    private Remetente remetente;

    @BeforeEach
    void setUp() {
        nutricionista = new Usuario();
        nutricionista.setNome("Nutricionista");
        nutricionista.setEmail("nutri-" + UUID.randomUUID() + "@ifpe.edu.br");
        nutricionista.setPerfil(Perfil.NUTRICIONISTA);
        nutricionista.setAtivo(true);
        nutricionista = usuarioRepository.save(nutricionista);

        remetente = new Remetente();
        remetente.setNome("Agroindústria " + UUID.randomUUID());
        remetente = remetenteRepository.save(remetente);
    }

    private UUID novaEntrada() {
        Produto produto = new Produto();
        produto.setNome("Doce de leite " + UUID.randomUUID());
        produto.setCategoria("Laticínios");
        produto.setUnidadeMedida("kg");
        produto = produtoRepository.save(produto);

        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Despensa " + UUID.randomUUID());
        local = localArmazenamentoRepository.save(local);

        Movimentacao entrada = new Movimentacao();
        entrada.setProduto(produto);
        entrada.setLocal(local);
        entrada.setTipo(TipoMovimentacao.ENTRADA);
        entrada.setOrigem(OrigemMovimentacao.AGROINDUSTRIA);
        entrada.setQuantidade(new BigDecimal("5"));
        entrada.setValor(new BigDecimal("10.00"));
        entrada.setData(LocalDate.now());
        entrada.setResponsavel(nutricionista);
        return movimentacaoRepository.save(entrada).getId();
    }

    private String emitir(UUID entradaId) {
        return notaService.emitirLocal(new NotaLocalRequestDTO(LocalDate.now(), remetente.getId(),
                List.of(entradaId), "Setor de Agroindústria", null), nutricionista).numero();
    }

    @Test
    void deveGerarNumerosSemRepetirNemPularComEmissoesSimultaneasERecomecarNoAnoSeguinte() throws Exception {
        when(clock.instant()).thenReturn(Instant.parse("2031-05-10T12:00:00Z"));
        List<UUID> entradas = new ArrayList<>();
        for (int i = 0; i < EMISSOES_SIMULTANEAS; i++) {
            entradas.add(novaEntrada());
        }

        // Todas as threads esperam o mesmo sinal para emitir ao mesmo tempo.
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(EMISSOES_SIMULTANEAS);
        List<Future<String>> numeros = new ArrayList<>();
        try {
            for (UUID entrada : entradas) {
                Callable<String> emissao = () -> {
                    largada.await();
                    return emitir(entrada);
                };
                numeros.add(executor.submit(emissao));
            }
            largada.countDown();

            List<String> gerados = new ArrayList<>();
            for (Future<String> numero : numeros) {
                gerados.add(numero.get(60, TimeUnit.SECONDS));
            }
            assertThat(gerados).containsExactlyInAnyOrder(
                    "NL-2031-0001", "NL-2031-0002", "NL-2031-0003", "NL-2031-0004", "NL-2031-0005");
        } finally {
            executor.shutdownNow();
        }

        when(clock.instant()).thenReturn(Instant.parse("2032-01-02T12:00:00Z"));
        assertThat(emitir(novaEntrada())).isEqualTo("NL-2032-0001");
    }
}
