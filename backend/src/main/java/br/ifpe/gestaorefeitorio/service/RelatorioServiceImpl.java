package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.MovimentacaoAgregadaDTO;
import br.ifpe.gestaorefeitorio.dto.RelatorioMensalItemDTO;
import br.ifpe.gestaorefeitorio.exception.PeriodoInvalidoException;
import br.ifpe.gestaorefeitorio.repository.MovimentacaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RelatorioServiceImpl implements RelatorioService {

    private final MovimentacaoRepository movimentacaoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RelatorioMensalItemDTO> gerarRelatorioMensal(LocalDate dataInicio, LocalDate dataFim) {
        if (dataFim.isBefore(dataInicio)) {
            throw new PeriodoInvalidoException();
        }

        List<MovimentacaoAgregadaDTO> agregados = movimentacaoRepository.agregarPorProdutoNoPeriodo(dataInicio, dataFim);

        log.info("Relatório mensal gerado: período {} a {}, {} produto(s) com movimentação",
                dataInicio, dataFim, agregados.size());

        // Saldo final é o saldo acumulado do produto até dataFim (estoque real naquele momento),
        // não a diferença entre entradas e saídas só do período — por isso é uma consulta à parte.
        return agregados.stream()
                .map(agregado -> new RelatorioMensalItemDTO(
                        agregado.produtoId(),
                        agregado.produtoNome(),
                        agregado.quantidadeEntradas(),
                        agregado.quantidadeSaidas(),
                        agregado.quantidadeProducaoInterna(),
                        agregado.valorEntradas(),
                        movimentacaoRepository.calcularSaldoTotalAteData(agregado.produtoId(), dataFim)))
                .toList();
    }
}
