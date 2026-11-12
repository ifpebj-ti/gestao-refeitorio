package br.ifpe.gestaorefeitorio.model;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NotaTest {

    @Test
    void naoDevePermitirAlterarMovimentacoesPeloGetter() {
        Nota nota = new Nota();
        List<Movimentacao> movimentacoes = nota.getMovimentacoes();
        Movimentacao entrada = new Movimentacao();

        assertThrows(UnsupportedOperationException.class, () -> movimentacoes.add(entrada));
    }

    @Test
    void deveSubstituirAsMovimentacoesVinculadas() {
        Nota nota = new Nota();
        Movimentacao antiga = new Movimentacao();
        Movimentacao nova = new Movimentacao();
        nota.substituirMovimentacoes(List.of(antiga));

        nota.substituirMovimentacoes(List.of(nova));

        assertThat(nota.getMovimentacoes()).containsExactly(nova);
    }
}
