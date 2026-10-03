export interface OpcaoUnidadeMedida {
  sigla: string;
  nome: string;
}

export const UNIDADES_MEDIDA_SUGERIDAS: OpcaoUnidadeMedida[] = [
  { sigla: "Kg", nome: "Quilograma (Kg)" },
  { sigla: "g", nome: "Grama (g)" },
  { sigla: "Lt", nome: "Litro (Lt)" },
  { sigla: "ml", nome: "Mililitro (ml)" },
  { sigla: "Und", nome: "Unidade (Und)" },
  { sigla: "Pct", nome: "Pacote (Pct)" },
  { sigla: "Cx", nome: "Caixa (Cx)" },
  { sigla: "Lata", nome: "Lata" },
  { sigla: "Vidro", nome: "Vidro" },
  { sigla: "Bandeja", nome: "Bandeja" },
  { sigla: "Maço", nome: "Maço" },
  { sigla: "Saco", nome: "Saco" },
  { sigla: "Fardo", nome: "Fardo" },
  { sigla: "Dúzia", nome: "Dúzia" },
];

/**
 * Normaliza ou identifica a unidade de medida para seleção padronizada.
 */
export function normalizarUnidadeMedida(unidade?: string): string {
  if (!unidade) return "Kg";
  const u = unidade.trim();
  const lower = u.toLowerCase();

  if (lower === "kg" || lower === "quilograma" || lower === "kilo") return "Kg";
  if (lower === "g" || lower === "grama" || lower === "gr") return "g";
  if (lower === "l" || lower === "lt" || lower === "litro" || lower === "litros") return "Lt";
  if (lower === "ml" || lower === "mililitro") return "ml";
  if (lower === "un" || lower === "und" || lower === "unidade" || lower === "unidades") return "Und";
  if (lower === "pct" || lower === "pacote" || lower === "pacotes") return "Pct";
  if (lower === "cx" || lower === "caixa" || lower === "caixas") return "Cx";
  if (lower === "lata" || lower === "latas") return "Lata";
  if (lower === "vidro" || lower === "vidros") return "Vidro";
  if (lower === "bandeja" || lower === "bandejas") return "Bandeja";
  if (lower.startsWith("maç") || lower.startsWith("mac")) return "Maço";
  if (lower === "saco" || lower === "sacos") return "Saco";
  if (lower === "fardo" || lower === "fardos") return "Fardo";
  if (lower === "dúzia" || lower === "duzia" || lower === "dúzias") return "Dúzia";

  return u;
}
