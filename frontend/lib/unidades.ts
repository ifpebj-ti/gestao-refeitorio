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

/**
 * Retorna as unidades de medida compatíveis/sugeridas para uma dada unidade base.
 */
export function obterUnidadesDisponiveis(unidadeBase: string): string[] {
  const base = normalizarUnidadeMedida(unidadeBase).toLowerCase();
  
  if (base === "kg") {
    return ["Kg", "g"];
  }
  if (base === "g") {
    return ["g", "Kg"];
  }
  if (base === "lt") {
    return ["Lt", "ml"];
  }
  if (base === "ml") {
    return ["ml", "Lt"];
  }
  if (base === "pct") {
    return ["Pct", "Und", "Cx", "g", "Kg"];
  }
  if (base === "und") {
    return ["Und", "Pct", "Cx", "Dúzia"];
  }
  if (base === "cx") {
    return ["Cx", "Und", "Pct"];
  }
  if (base === "maço") {
    return ["Maço", "Und"];
  }
  if (base === "lata") {
    return ["Lata", "Und"];
  }
  if (base === "vidro") {
    return ["Vidro", "Und"];
  }

  // Se for unidade personalizada ou não mapeada, oferece a própria unidade e as comuns
  const lista = [unidadeBase || "Und"];
  if (!lista.includes("Und")) lista.push("Und");
  if (!lista.includes("Kg")) lista.push("Kg");
  if (!lista.includes("g")) lista.push("g");
  return lista;
}

/**
 * Converte um valor da unidade escolhida para a unidade base do insumo.
 */
export function converterParaUnidadeBase(
  valor: number,
  unidadeEscolhida: string,
  unidadeBase: string
): number {
  if (!valor || valor <= 0) return 0;
  const esc = (unidadeEscolhida || "").toLowerCase().trim();
  const base = (unidadeBase || "").toLowerCase().trim();

  if (esc === base) return valor;

  // g -> kg (ex: 500g = 0.5kg)
  if (esc === "g" && (base === "kg" || base === "quilo" || base === "quilograma")) {
    return Number((valor / 1000).toFixed(4));
  }
  // kg -> g (ex: 2kg = 2000g)
  if ((esc === "kg" || esc === "quilo" || esc === "quilograma") && base === "g") {
    return Number((valor * 1000).toFixed(2));
  }
  // ml -> lt (ex: 500ml = 0.5lt)
  if (esc === "ml" && (base === "lt" || base === "l" || base === "litro" || base === "litros")) {
    return Number((valor / 1000).toFixed(4));
  }
  // lt -> ml (ex: 1lt = 1000ml)
  if ((esc === "lt" || esc === "l" || esc === "litro" || esc === "litros") && base === "ml") {
    return Number((valor * 1000).toFixed(2));
  }
  // dúzia -> und
  if ((esc === "dúzia" || esc === "duzia") && (base === "und" || base === "unidade")) {
    return Number((valor * 12).toFixed(2));
  }

  return valor;
}
