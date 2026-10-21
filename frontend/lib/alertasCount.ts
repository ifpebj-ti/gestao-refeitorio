import { ProdutoResponse } from "@/lib/produtos";
import { MovimentacaoResponse } from "@/lib/movimentacoes";
import { obterEstoqueMinimoProduto } from "@/app/utils/estoqueRules";

export function calcularTotalAlertas(
  produtos: ProdutoResponse[],
  movimentacoes?: MovimentacaoResponse[]
): number {
  if (!produtos || produtos.length === 0) return 0;

  let total = 0;

  produtos.forEach((prod) => {
    const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
    const estoqueMinimo = obterEstoqueMinimoProduto(prod.quantidadeMinima);

    // 1. Estoque Zerado
    if (saldo <= 0) {
      total++;
      return;
    }

    // 2. Estoque Baixo (apenas se houver quantidade mínima configurada)
    if (estoqueMinimo !== undefined && saldo <= estoqueMinimo) {
      total++;
    }

    // 3. Validade Real (a partir das movimentações de entrada registradas)
    if (movimentacoes && movimentacoes.length > 0 && saldo > 0) {
      const entradasValidade = movimentacoes.filter(
        (m) => m.produtoId === prod.id && m.tipo === "ENTRADA" && m.dataValidade
      );

      const temLoteEmAlerta = entradasValidade.some((entrada) => {
        if (!entrada.dataValidade) return false;
        try {
          const [ano, mes, dia] = entrada.dataValidade.split("-").map(Number);
          if (!ano || !mes || !dia) return false;
          const dataVal = new Date(ano, mes - 1, dia);
          dataVal.setHours(0, 0, 0, 0);

          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          const diffMs = dataVal.getTime() - hoje.getTime();
          const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
          return diasRestantes <= 7;
        } catch {
          return false;
        }
      });

      if (temLoteEmAlerta) {
        total++;
      }
    }
  });

  return total;
}
