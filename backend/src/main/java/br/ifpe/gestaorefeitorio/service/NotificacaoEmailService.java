package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.model.Produto;

import java.util.List;

/**
 * Resumo diário dos alertas por e-mail para as nutricionistas ativas (#203).
 * Nunca lança exceção por falha de e-mail: um job agendado não pode falhar por causa do SMTP.
 */
public interface NotificacaoEmailService {

    void enviarAlertaEstoqueBaixo(List<Produto> produtos);

    void enviarAlertaValidade(List<Produto> altaPrioridade, List<Produto> prioridadeNormal);
}
