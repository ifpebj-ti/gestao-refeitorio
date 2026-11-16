package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.exception.EnvioEmailException;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Alertas por e-mail às nutricionistas (#203): conteúdo, envio individual, desligamento e falha de SMTP.
 */
@ExtendWith(MockitoExtension.class)
class NotificacaoEmailServiceImplTest {

    @Mock
    private EmailService emailService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MovimentacaoRepository movimentacaoRepository;

    private NotificacaoEmailServiceImpl service(boolean habilitado) {
        return new NotificacaoEmailServiceImpl(emailService, usuarioRepository, movimentacaoRepository, habilitado);
    }

    private Usuario nutricionista(String email) {
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setPerfil(Perfil.NUTRICIONISTA);
        usuario.setAtivo(true);
        return usuario;
    }

    private Produto produto(String nome, String unidade, String minimo) {
        Produto produto = new Produto();
        produto.setId(UUID.randomUUID());
        produto.setNome(nome);
        produto.setUnidadeMedida(unidade);
        produto.setQuantidadeMinima(minimo == null ? null : new BigDecimal(minimo));
        return produto;
    }

    private String corpoEnviadoPara(String email) {
        ArgumentCaptor<String> corpo = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviar(eq(email), anyString(), corpo.capture());
        return corpo.getValue();
    }

    @Test
    void naoDeveEnviarNemConsultarNutricionistasQuandoAlertaEstaDesligado() {
        NotificacaoEmailServiceImpl service = service(false);

        service.enviarAlertaEstoqueBaixo(List.of(produto("Arroz", "kg", "10")));
        service.enviarAlertaValidade(List.of(produto("Frango", "kg", null)), List.of());

        verifyNoInteractions(emailService, usuarioRepository);
    }

    @Test
    void naoDeveEnviarQuandoNaoHaNutricionistaAtiva() {
        when(usuarioRepository.findByPerfilAndAtivoTrue(Perfil.NUTRICIONISTA)).thenReturn(List.of());

        service(true).enviarAlertaEstoqueBaixo(List.of(produto("Arroz", "kg", "10")));

        verifyNoInteractions(emailService);
    }

    @Test
    void deveEnviarUmEmailPorNutricionistaComSaldoEMinimoDoEstoqueBaixo() {
        Produto arroz = produto("Arroz", "kg", "10.00");
        Produto oleo = produto("Óleo", "L", "5");
        when(movimentacaoRepository.calcularSaldoTotal(arroz.getId())).thenReturn(new BigDecimal("2.50"));
        when(movimentacaoRepository.calcularSaldoTotal(oleo.getId())).thenReturn(null);
        when(usuarioRepository.findByPerfilAndAtivoTrue(Perfil.NUTRICIONISTA))
                .thenReturn(List.of(nutricionista("ana@ifpe.edu.br"), nutricionista("bia@ifpe.edu.br")));

        service(true).enviarAlertaEstoqueBaixo(List.of(arroz, oleo));

        String assunto = "[Gestão Refeitório] Estoque baixo: 2 produto(s)";
        verify(emailService).enviar(eq("ana@ifpe.edu.br"), eq(assunto), anyString());
        verify(emailService).enviar(eq("bia@ifpe.edu.br"), eq(assunto), anyString());
        assertThat(corpoEnviadoPara("ana@ifpe.edu.br"))
                .contains("- Arroz: saldo 2.5 kg (mínimo 10 kg)")
                .contains("- Óleo: saldo 0 L (mínimo 5 L)");
    }

    @Test
    void deveMontarAsSecoesDeValidadeComADataMaisProxima() {
        Produto frango = produto("Frango", "kg", null);
        Produto arroz = produto("Arroz", "kg", null);
        LocalDate vencimento = LocalDate.now().plusDays(2);
        when(movimentacaoRepository.buscarValidadeMaisProxima(eq(frango.getId()), any())).thenReturn(vencimento);
        when(movimentacaoRepository.buscarValidadeMaisProxima(eq(arroz.getId()), any())).thenReturn(null);
        when(usuarioRepository.findByPerfilAndAtivoTrue(Perfil.NUTRICIONISTA))
                .thenReturn(List.of(nutricionista("ana@ifpe.edu.br")));

        service(true).enviarAlertaValidade(List.of(frango), List.of(arroz));

        verify(emailService).enviar(eq("ana@ifpe.edu.br"),
                eq("[Gestão Refeitório] Validade próxima: 2 produto(s)"), anyString());
        assertThat(corpoEnviadoPara("ana@ifpe.edu.br"))
                .contains("Alta prioridade (frios):")
                .contains("- Frango: vence em " + vencimento.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .contains("Demais produtos:")
                .contains("- Arroz: vence em -");
    }

    @Test
    void deveOmitirASecaoDeAltaPrioridadeQuandoNaoHaFrios() {
        Produto arroz = produto("Arroz", "kg", null);
        when(usuarioRepository.findByPerfilAndAtivoTrue(Perfil.NUTRICIONISTA))
                .thenReturn(List.of(nutricionista("ana@ifpe.edu.br")));

        service(true).enviarAlertaValidade(List.of(), List.of(arroz));

        assertThat(corpoEnviadoPara("ana@ifpe.edu.br"))
                .doesNotContain("Alta prioridade")
                .contains("Demais produtos:");
    }

    @Test
    void deveContinuarEnviandoParaAsDemaisQuandoUmEnvioFalha() {
        when(movimentacaoRepository.calcularSaldoTotal(any())).thenReturn(BigDecimal.ONE);
        when(usuarioRepository.findByPerfilAndAtivoTrue(Perfil.NUTRICIONISTA))
                .thenReturn(List.of(nutricionista("ana@ifpe.edu.br"), nutricionista("bia@ifpe.edu.br")));
        doThrow(new EnvioEmailException(new RuntimeException("SMTP fora do ar")))
                .when(emailService).enviar(eq("ana@ifpe.edu.br"), anyString(), anyString());

        assertThatCode(() -> service(true).enviarAlertaEstoqueBaixo(List.of(produto("Arroz", "kg", "10"))))
                .doesNotThrowAnyException();

        verify(emailService).enviar(eq("bia@ifpe.edu.br"), anyString(), anyString());
    }
}
