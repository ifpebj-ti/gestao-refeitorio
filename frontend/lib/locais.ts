import {
  garantirSessaoAtiva,
  tratarSessaoExpiradaSe401,
} from "./authSession";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface LocalArmazenamentoDTO {
  id: string;
  nome: string;
}

export async function listarLocaisArmazenamento(): Promise<LocalArmazenamentoDTO[]> {
  const res = await fetch(`${BASE_URL}/locais-armazenamento`, {
    headers: garantirSessaoAtiva(
      "Sessão expirada. Faça login novamente para consultar os locais de armazenamento."
    ),
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    tratarSessaoExpiradaSe401(res.status);
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.mensagem ||
        errorData?.message ||
        `Erro ao listar locais de armazenamento (${res.status})`
    );
  }

  return res.json();
}

export function resolverLocalIdPorCategoria(
  locais: LocalArmazenamentoDTO[],
  categoria: string
): string {
  if (!Array.isArray(locais) || locais.length === 0) {
    throw new Error(
      "Nenhum local de armazenamento cadastrado no sistema. Contate o administrador."
    );
  }

  const cat = (categoria || "").toLowerCase();
  const ehRefrigerado =
    cat.includes("proteína") ||
    cat.includes("proteina") ||
    cat.includes("frio") ||
    cat.includes("laticínio") ||
    cat.includes("laticinio");

  const encontrado = ehRefrigerado
    ? locais.find((l) => {
        const nome = l.nome.toLowerCase();
        return nome.includes("congelado") || nome.includes("refrigerado");
      })
    : locais.find((l) => l.nome.toLowerCase().includes("despensa"));

  return (encontrado || locais[0]).id;
}
