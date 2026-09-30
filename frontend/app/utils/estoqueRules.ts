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
 * Determina se o insumo atingiu nível de atenção/reposição.
 * Para gramas (ex: açafrão, coloral), 500g equivale à proporção mínima.
 * ajustável ainda dependendo de algum feedback de hitalo
 */
export function verificarStatusEstoque(
  saldoAtual: number,
  unidade: string,
  categoria: CategoriaAlimento | string
): "NORMAL" | "ATENCAO" {
  if (unidade.toLowerCase() === "g") {
    return saldoAtual < 500 ? "ATENCAO" : "NORMAL";
  }

  const minimo = obterEstoqueMinimoPorCategoria(categoria);
  return saldoAtual <= minimo ? "ATENCAO" : "NORMAL";
}