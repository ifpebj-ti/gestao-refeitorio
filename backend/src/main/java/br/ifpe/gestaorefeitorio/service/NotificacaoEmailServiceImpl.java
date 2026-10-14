package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.exception.EnvioEmailException;
import br.ifpe.gestaorefeitorio.model.Produto;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class NotificacaoEmailServiceImpl implements NotificacaoEmailService {

    private static final DateTimeFormatter FORMATO_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final boolean habilitado;

    public NotificacaoEmailServiceImpl(EmailService emailService, UsuarioRepository usuarioRepository,
            MovimentacaoRepository movimentacaoRepository,
            @Value("${email.alerta.habilitado}") boolean habilitado) {
        this.emailService = emailService;
        this.usuarioRepository = usuarioRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.habilitado = habilitado;
    }

    @Override
    public void enviarAlertaEstoqueBaixo(List<Produto> produtos) {
        StringBuilder corpo = new StringBuilder()
                .append("Produtos com estoque igual ou abaixo da quantidade mínima:\n\n");
        for (Produto produto : produtos) {
            BigDecimal saldo = movimentacaoRepository.calcularSaldoTotal(produto.getId());
            corpo.append("- ").append(produto.getNome())
                    .append(": saldo ").append(formatar(saldo)).append(' ').append(produto.getUnidadeMedida())
                    .append(" (mínimo ").append(formatar(produto.getQuantidadeMinima())).append(' ')
                    .append(produto.getUnidadeMedida()).append(")\n");
        }

        enviarParaNutricionistas("Alerta de estoque baixo", produtos.size(),
                "[Gestão Refeitório] Estoque baixo: " + produtos.size() + " produto(s)", corpo.toString());
    }

    @Override
    public void enviarAlertaValidade(List<Produto> altaPrioridade, List<Produto> prioridadeNormal) {
        LocalDate hoje = LocalDate.now();
        StringBuilder corpo = new StringBuilder()
                .append("Produtos com validade próxima (até 3 dias):\n");
        adicionarSecaoValidade(corpo, "Alta prioridade (frios)", altaPrioridade, hoje);
        adicionarSecaoValidade(corpo, "Demais produtos", prioridadeNormal, hoje);

        int total = altaPrioridade.size() + prioridadeNormal.size();
        enviarParaNutricionistas("Alerta de validade", total,
                "[Gestão Refeitório] Validade próxima: " + total + " produto(s)", corpo.toString());
    }

    private void adicionarSecaoValidade(StringBuilder corpo, String titulo, List<Produto> produtos, LocalDate hoje) {
        if (produtos.isEmpty()) {
            return;
        }
        corpo.append('\n').append(titulo).append(":\n");
        for (Produto produto : produtos) {
            LocalDate validade = movimentacaoRepository.buscarValidadeMaisProxima(produto.getId(), hoje);
            corpo.append("- ").append(produto.getNome())
                    .append(": vence em ").append(validade != null ? validade.format(FORMATO_DATA) : "-")
                    .append('\n');
        }
    }

    private void enviarParaNutricionistas(String tipoAlerta, int quantidadeProdutos, String assunto, String corpo) {
        if (!habilitado) {
            log.info("{} não enviado por e-mail: envio desabilitado (ALERTA_EMAIL_HABILITADO=false)", tipoAlerta);
            return;
        }

        List<Usuario> destinatarias = usuarioRepository.findByPerfilAndAtivoTrue(Perfil.NUTRICIONISTA);
        if (destinatarias.isEmpty()) {
            log.warn("{} não enviado: nenhuma nutricionista ativa cadastrada", tipoAlerta);
            return;
        }

        // Um e-mail por destinatária, pra não expor o endereço de uma nutricionista pra outra.
        int enviados = 0;
        for (Usuario destinataria : destinatarias) {
            try {
                emailService.enviar(destinataria.getEmail(), assunto, corpo);
                enviados++;
            } catch (EnvioEmailException e) {
                log.error("{} não enviado para {}", tipoAlerta, destinataria.getEmail());
            }
        }

        log.info("{} enviado para {} de {} destinatária(s), {} produto(s)",
                tipoAlerta, enviados, destinatarias.size(), quantidadeProdutos);
    }

    private String formatar(BigDecimal valor) {
        return valor == null ? "0" : valor.stripTrailingZeros().toPlainString();
    }
}
