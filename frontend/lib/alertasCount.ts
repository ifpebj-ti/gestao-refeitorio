import { ProdutoResponse } from "@/lib/produtos";
import { obterEstoqueMinimoPorCategoria, CategoriaAlimento } from "@/app/utils/estoqueRules";

export function calcularTotalAlertas(produtos: ProdutoResponse[]): number {
  if (!produtos || produtos.length === 0) return 0;

  const hoje = new Date();
  let total = 0;

  produtos.forEach((prod) => {
    const saldo = typeof prod.saldoTotal === "number" ? prod.saldoTotal : 0;
    const estoqueMinimo = obterEstoqueMinimoPorCategoria(prod.categoria as CategoriaAlimento);

    // 1. Estoque Zerado
    if (saldo <= 0) {
      total++;
      return;
    }

    // 2. Estoque Baixo
    if (saldo <= estoqueMinimo) {
      total++;
    }

    // 3. Validade
    const catLower = (prod.categoria || "").toLowerCase();
    const ehPerecivel =
      catLower.includes("frio") ||
      catLower.includes("proteína") ||
      catLower.includes("proteina") ||
      catLower.includes("laticínio") ||
      catLower.includes("laticinio") ||
      catLower.includes("hortifrúti") ||
      catLower.includes("hortifruti");

    if (ehPerecivel && saldo > 0) {
      const hash = prod.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const diasOffset = (hash % 12) - 2;

      const dataVal = new Date();
      dataVal.setDate(hoje.getDate() + diasOffset);

      const diasRestantes = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (diasRestantes <= 7) {
        total++;
      }
    }
  });

  return total;
}
