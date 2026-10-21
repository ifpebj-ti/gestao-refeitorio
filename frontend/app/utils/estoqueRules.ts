export type CategoriaAlimento =
  | "Grãos & Cereais"
  | "Proteínas & Frios"
  | "Hortifrúti"
  | "Laticínios"
  | "Especificações & Condimentos";

/**
 * Patamar mínimo de segurança por categoria
 * pensado  para o volume de atendimento do refeitório
 */
export function obterEstoqueMinimoPorCategoria(categoria: CategoriaAlimento | string): number {
  switch (categoria) {
    case "Grãos & Cereais":
      return 40; // 40 Kg
    case "Proteínas & Frios":
      return 35; // 35 Kg
    case "Hortifrúti":
      return 15; // 15 Kg ou maços
    case "Laticínios":
      return 20; // 20 Lt, Kg ou Und
    case "Especificações & Condimentos":
      return 10; // 10 Kg, Lt ou Pct (para gramas tratamos proporcionalmente)
    default:
      return 20;
  }
}

/**
 * Obtém o estoque mínimo configurado para o produto.
 * Se não houver quantidade mínima definida (ou for <= 0), retorna undefined para não exibir valor fictício.
 */
export function obterEstoqueMinimoProduto(
  quantidadeMinima?: number | null
): number | undefined {
  if (quantidadeMinima !== undefined && quantidadeMinima !== null && Number(quantidadeMinima) > 0) {
    return Number(quantidadeMinima);
  }
  return undefined;
}

/**
 * Determina se o insumo atingiu nível de atenção/reposição.
 * Prioriza a quantidade mínima personalizada cadastrada pela nutricionista.
 * Se o produto não tiver quantidade mínima configurada, entra em ATENCAO apenas se o saldo estiver zerado.
 */
export function verificarStatusEstoque(
  saldoAtual: number,
  unidade: string,
  categoria: CategoriaAlimento | string,
  quantidadeMinima?: number | null
): "NORMAL" | "ATENCAO" {
  if (quantidadeMinima !== undefined && quantidadeMinima !== null && Number(quantidadeMinima) > 0) {
    return saldoAtual <= Number(quantidadeMinima) ? "ATENCAO" : "NORMAL";
  }

  if (saldoAtual <= 0) {
    return "ATENCAO";
  }

  return "NORMAL";
}