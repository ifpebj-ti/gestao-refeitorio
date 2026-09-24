package br.ifpe.gestaorefeitorio.controller;

import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.model.Movimentacao;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.OrigemMovimentacao;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.model.enums.TipoMovimentacao;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.ProdutoRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;

/**
 * Testes de integração ponta a ponta do registro de entrada de produto
 * (US07/#84) e de anexar/consultar foto de movimentação (US08/#88),
 * cobrindo os critérios de aceite da #86 e da #89.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class MovimentacaoControllerIntegrationTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    @Autowired
    private JwtService jwtService;

    private Usuario criarUsuario(Perfil perfil) {
        Usuario usuario = new Usuario();
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(perfil + "-" + UUID.randomUUID() + "@ifpe.edu.br");
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }

    private String tokenPara(Perfil perfil) {
        Usuario usuario = criarUsuario(perfil);
        return jwtService.gerarToken(usuario.getEmail(), usuario.getPerfil().name());
    }

    private Movimentacao criarMovimentacao() {
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();
        Usuario responsavel = criarUsuario(Perfil.COZINHA);

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setLocal(local);
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setOrigem(OrigemMovimentacao.EXTERNA);
        movimentacao.setQuantidade(new BigDecimal("10"));
        movimentacao.setValor(new BigDecimal("50.00"));
        movimentacao.setData(LocalDate.now());
        movimentacao.setResponsavel(responsavel);
        return movimentacaoRepository.save(movimentacao);
    }

    private Produto criarProduto() {
        Produto produto = new Produto();
        produto.setNome("Arroz");
        produto.setCategoria("Secos");
        produto.setUnidadeMedida("kg");
        return produtoRepository.save(produto);
    }

    private LocalArmazenamento criarLocal() {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setNome("Despensa " + UUID.randomUUID());
        return localArmazenamentoRepository.save(local);
    }

    private String corpoValido(UUID produtoId, UUID localId) {
        return """
                {"produtoId":"%s","localId":"%s","quantidade":10,"data":"2026-01-10","origem":"EXTERNA","valor":50.00}
                """.formatted(produtoId, localId);
    }

    private String corpoSaidaValido(UUID produtoId, UUID localId, String quantidade) {
        return """
                {"produtoId":"%s","localId":"%s","quantidade":%s,"data":"2026-01-10","tipoSaida":"CONSUMO"}
                """.formatted(produtoId, localId, quantidade);
    }

    @Test
    void deveRetornar201AoRegistrarEntradaValidaEAumentarSaldo() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("ENTRADA"))
                .andExpect(jsonPath("$.quantidade").value(10))
                .andExpect(jsonPath("$.saldoAtual").value(10));
    }

    @Test
    void deveRetornar404QuandoProdutoInexistente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(UUID.randomUUID(), local.getId())))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar404QuandoLocalInexistente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), UUID.randomUUID())))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar400QuandoQuantidadeZeroOuNegativa() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":0,"data":"2026-01-10","origem":"EXTERNA","valor":50.00}
                                """.formatted(produto.getId(), local.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400QuandoCamposObrigatoriosAusentes() throws Exception {
        String token = tokenPara(Perfil.COZINHA);

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar403QuandoPerfilAdmin() throws Exception {
        String token = tokenPara(Perfil.ADMIN);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarQuandoPerfilNutricionista() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId())))
                .andExpect(status().isCreated());
    }

    @Test
    void deveRetornar201AoRegistrarSaidaValidaEReduzirSaldo() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/entrada")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoValido(produto.getId(), local.getId())))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoSaidaValido(produto.getId(), local.getId(), "4")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("SAIDA"))
                .andExpect(jsonPath("$.tipoSaida").value("CONSUMO"))
                .andExpect(jsonPath("$.saldoAtual").value(6));
    }

    @Test
    void deveRetornar404QuandoProdutoInexistenteNaSaida() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoSaidaValido(UUID.randomUUID(), local.getId(), "4")))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar404QuandoLocalInexistenteNaSaida() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();

        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoSaidaValido(produto.getId(), UUID.randomUUID(), "4")))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar400QuandoQuantidadeZeroOuNegativaNaSaida() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoSaidaValido(produto.getId(), local.getId(), "0")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400QuandoTipoSaidaAusente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId":"%s","localId":"%s","quantidade":4,"data":"2026-01-10"}
                                """.formatted(produto.getId(), local.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar403QuandoPerfilAdminNaSaida() throws Exception {
        String token = tokenPara(Perfil.ADMIN);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoSaidaValido(produto.getId(), local.getId(), "4")))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarQuandoPerfilNutricionistaNaSaida() throws Exception {
        String token = tokenPara(Perfil.NUTRICIONISTA);
        Produto produto = criarProduto();
        LocalArmazenamento local = criarLocal();

        mockMvc.perform(post("/api/movimentacoes/saida")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoSaidaValido(produto.getId(), local.getId(), "4")))
                .andExpect(status().isCreated());
    }

    @Test
    void deveAnexarFotoValidaEDepoisRecuperarOsMesmosBytes() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Movimentacao movimentacao = criarMovimentacao();
        byte[] bytesOriginais = "conteudo-fake-da-foto".getBytes();
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", bytesOriginais);

        mockMvc.perform(multipart("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value("image/jpeg"));

        mockMvc.perform(get("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/jpeg"))
                .andExpect(content -> assertArrayEquals(bytesOriginais, content.getResponse().getContentAsByteArray()));
    }

    @Test
    void deveRetornar400AoAnexarTipoDeArquivoNaoPermitido() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Movimentacao movimentacao = criarMovimentacao();
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "documento.pdf", "application/pdf", "conteudo".getBytes());

        mockMvc.perform(multipart("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar400AoAnexarArquivoAcimaDoLimite() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Movimentacao movimentacao = criarMovimentacao();
        MockMultipartFile arquivo = new MockMultipartFile(
                "arquivo", "foto.jpg", "image/jpeg", new byte[6 * 1024 * 1024]);

        mockMvc.perform(multipart("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deveRetornar404AoAnexarFotoEmMovimentacaoInexistente() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", "conteudo".getBytes());

        mockMvc.perform(multipart("/api/movimentacoes/" + UUID.randomUUID() + "/foto")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar404AoBuscarFotoDeMovimentacaoSemFotoAnexada() throws Exception {
        String token = tokenPara(Perfil.COZINHA);
        Movimentacao movimentacao = criarMovimentacao();

        mockMvc.perform(get("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deveRetornar403AoAnexarFotoComPerfilAdmin() throws Exception {
        String token = tokenPara(Perfil.ADMIN);
        Movimentacao movimentacao = criarMovimentacao();
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", "conteudo".getBytes());

        mockMvc.perform(multipart("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deveAutorizarConsultaDeFotoParaQualquerPerfilAutenticado() throws Exception {
        String tokenCozinha = tokenPara(Perfil.COZINHA);
        Movimentacao movimentacao = criarMovimentacao();
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", "conteudo".getBytes());

        mockMvc.perform(multipart("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + tokenCozinha))
                .andExpect(status().isCreated());

        String tokenAdmin = tokenPara(Perfil.ADMIN);
        mockMvc.perform(get("/api/movimentacoes/" + movimentacao.getId() + "/foto")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
    }
}
