package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.TipoSaida;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração ponta a ponta do registro de nota de recebimento (US27/#287), cobrindo
 * os critérios de aceite: nota PENDENTE com as entradas vinculadas, número único por remetente,
 * validação de remetente e movimentações, e restrição ao perfil NUTRICIONISTA.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class NotaControllerIntegrationTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

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

    @Autowired
    private JwtService jwtService;

    private Usuario nutricionista;
    private String tokenNutricionista;
    private Remetente remetente;

    @BeforeEach
    void setUp() {
        nutricionista = criarUsuario(Perfil.NUTRICIONISTA);
        tokenNutricionista = tokenPara(nutricionista);
        remetente = criarRemetente("Agroindústria", true);
    }

    private Usuario criarUsuario(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil.name().toLowerCase() + "-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }

    private String tokenPara(Usuario usuario) {
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private Remetente criarRemetente(String nome, boolean ativo) {
        Remetente novo = new Remetente();
        novo.setNome(nome + " " + UUID.randomUUID());
        novo.setAtivo(ativo);
        return remetenteRepository.save(novo);
    }

    private Movimentacao criarMovimentacao(TipoMovimentacao tipo) {
        Produto produto = new Produto();
        produto.setNome("Feijão " + UUID.randomUUID());
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        produto = produtoRepository.save(produto);

        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Despensa " + UUID.randomUUID());
        local = localArmazenamentoRepository.save(local);

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setTipo(tipo);
        movimentacao.setQuantidade(new BigDecimal("10"));
        movimentacao.setData(LocalDate.now());
        movimentacao.setResponsavel(nutricionista);
        if (tipo == TipoMovimentacao.ENTRADA) {
            movimentacao.setOrigem(OrigemMovimentacao.EXTERNA);
            movimentacao.setValor(new BigDecimal("50.00"));
            movimentacao.setLote("L-2026-01");
            movimentacao.setDataValidade(LocalDate.now().plusMonths(6));
        } else {
            movimentacao.setTipoSaida(TipoSaida.CONSUMO);
        }
        return movimentacaoRepository.save(movimentacao);
    }

    private String corpo(String numero, String data, UUID remetenteId, List<UUID> movimentacaoIds) {
        String ids = movimentacaoIds.stream().map(id -> "\"" + id + "\"").collect(Collectors.joining(","));
        return """
                {"numero":"%s","data":"%s","remetenteId":"%s","movimentacaoIds":[%s],"observacoes":"Entrega parcial"}
                """.formatted(numero, data, remetenteId, ids);
    }

    private String corpo(String numero, UUID remetenteId, List<UUID> movimentacaoIds) {
        return corpo(numero, LocalDate.now().toString(), remetenteId, movimentacaoIds);
    }

    private ResultActions registrar(String token, String corpo) throws Exception {
        return mockMvc.perform(post("/api/notas")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    @Test
    void deveRetornar201ComNotaPendenteEEntradasVinculadas() throws Exception {
        Movimentacao entrada1 = criarMovimentacao(TipoMovimentacao.ENTRADA);
        Movimentacao entrada2 = criarMovimentacao(TipoMovimentacao.ENTRADA);

        registrar(tokenNutricionista, corpo(" NF-100 ", remetente.getId(), List.of(entrada1.getId(), entrada2.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.numero").value("NF-100"))
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.observacoes").value("Entrega parcial"))
                .andExpect(jsonPath("$.remetente.id").value(remetente.getId().toString()))
                .andExpect(jsonPath("$.remetente.nome").value(remetente.getNome()))
                .andExpect(jsonPath("$.registradoPor.email").value(nutricionista.getEmail()))
                .andExpect(jsonPath("$.entradas.length()").value(2))
                .andExpect(jsonPath("$.entradas[0].movimentacaoId").value(entrada1.getId().toString()))
                .andExpect(jsonPath("$.entradas[0].produtoNome").value(entrada1.getProduto().getNome()))
                .andExpect(jsonPath("$.entradas[0].quantidade").value(10))
                .andExpect(jsonPath("$.entradas[0].unidadeMedida").value("kg"))
                .andExpect(jsonPath("$.entradas[0].localNome").value(entrada1.getLocal().getNome()))
                .andExpect(jsonPath("$.entradas[0].lote").value("L-2026-01"))
                .andExpect(jsonPath("$.entradas[0].dataValidade").value(entrada1.getDataValidade().toString()))
                .andExpect(jsonPath("$.entradas[0].data").value(entrada1.getData().toString()));
    }

    @Test
    void deveRetornar409QuandoNumeroJaUsadoPeloMesmoRemetente() throws Exception {
        registrar(tokenNutricionista, corpo("NF-200", remetente.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isCreated());

        registrar(tokenNutricionista, corpo("NF-200", remetente.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void devePermitirMesmoNumeroParaRemetentesDiferentes() throws Exception {
        Remetente outro = criarRemetente("Cooperativa", true);

        registrar(tokenNutricionista, corpo("NF-300", remetente.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isCreated());

        registrar(tokenNutricionista, corpo("NF-300", outro.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isCreated());
    }

    @Test
    void deveRetornar404QuandoRemetenteInexistente() throws Exception {
        registrar(tokenNutricionista, corpo("NF-1", UUID.randomUUID(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar409QuandoRemetenteInativo() throws Exception {
        Remetente inativo = criarRemetente("Inativo", false);

        registrar(tokenNutricionista, corpo("NF-1", inativo.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRetornar404QuandoMovimentacaoInexistente() throws Exception {
        registrar(tokenNutricionista, corpo("NF-1", remetente.getId(), List.of(UUID.randomUUID())))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar400QuandoMovimentacaoDeSaida() throws Exception {
        registrar(tokenNutricionista, corpo("NF-1", remetente.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.SAIDA).getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar409QuandoEntradaJaVinculadaAOutraNota() throws Exception {
        Movimentacao entrada = criarMovimentacao(TipoMovimentacao.ENTRADA);

        registrar(tokenNutricionista, corpo("NF-400", remetente.getId(), List.of(entrada.getId())))
                .andExpect(status().isCreated());

        registrar(tokenNutricionista, corpo("NF-401", remetente.getId(), List.of(entrada.getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRetornar400QuandoListaDeMovimentacoesVazia() throws Exception {
        registrar(tokenNutricionista, corpo("NF-1", remetente.getId(), List.of()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.movimentacaoIds").exists());
    }

    @Test
    void deveRetornar400QuandoMovimentacoesRepetidas() throws Exception {
        UUID id = criarMovimentacao(TipoMovimentacao.ENTRADA).getId();

        registrar(tokenNutricionista, corpo("NF-1", remetente.getId(), List.of(id, id)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400QuandoDataNoFuturo() throws Exception {
        registrar(tokenNutricionista, corpo("NF-1", LocalDate.now().plusDays(2).toString(), remetente.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.data").exists());
    }

    @Test
    void deveRetornar400QuandoNumeroEmBranco() throws Exception {
        registrar(tokenNutricionista, corpo("  ", remetente.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.numero").exists());
    }

    @ParameterizedTest
    @EnumSource(value = Perfil.class, names = { "COZINHA", "ADMIN" })
    void deveRetornar403ParaPerfilSemPermissao(Perfil perfil) throws Exception {
        registrar(tokenPara(criarUsuario(perfil)), corpo("NF-1", remetente.getId(),
                List.of(criarMovimentacao(TipoMovimentacao.ENTRADA).getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveRetornar401SemToken() throws Exception {
        mockMvc.perform(post("/api/notas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo("NF-1", remetente.getId(), List.of(UUID.randomUUID()))))
                .andExpect(status().isUnauthorized());
    }
}
