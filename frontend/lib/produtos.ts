import { api } from "./api";

export interface ProdutoResponse {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  valorReferencia?: number | null;
  quantidadeMinima?: number;
  controlaValidade?: boolean;
  saldoTotal: number;
  podeExcluir?: boolean;
}

export type Produto = ProdutoResponse;

export interface ProdutoRequest {
  nome: string;
  categoria: string;
  unidadeMedida: string;
  valorReferencia?: number | null;
}

export const MAX_TAMANHO_NOME_PRODUTO = 100;
export const MAX_TAMANHO_UNIDADE_MEDIDA = 20;
export const MAX_VALOR_NUMERIC_PRODUTO = 999999.99;

export function validarDadosProduto(
  dados: {
    nome?: string;
    unidadeMedida?: string;
    valorReferencia?: number | null;
    quantidadeMinima?: number | null;
  },
  catalogoExistente: Pick<ProdutoResponse, "id" | "nome">[] = [],
  ignorarId?: string
): void {
  if (dados.nome !== undefined) {
    const nomeLimpo = dados.nome.trim();
    if (!nomeLimpo) {
      throw new Error("O nome do insumo é obrigatório.");
    }
    if (nomeLimpo.length > MAX_TAMANHO_NOME_PRODUTO) {
      throw new Error(
        `O nome do insumo deve ter no máximo ${MAX_TAMANHO_NOME_PRODUTO} caracteres.`
      );
    }
    const duplicado = catalogoExistente.some(
      (p) =>
        p.id !== ignorarId &&
        p.nome.trim().toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (duplicado) {
      throw new Error("Já existe um insumo cadastrado com este nome no catálogo.");
    }
  }

  if (dados.unidadeMedida !== undefined) {
    const unidadeLimpa = dados.unidadeMedida.trim();
    if (!unidadeLimpa) {
      throw new Error("A unidade de medida é obrigatória.");
    }
    if (unidadeLimpa.length > MAX_TAMANHO_UNIDADE_MEDIDA) {
      throw new Error(
        `A unidade de medida deve ter no máximo ${MAX_TAMANHO_UNIDADE_MEDIDA} caracteres.`
      );
    }
  }

  if (dados.valorReferencia !== undefined && dados.valorReferencia !== null) {
    if (
      isNaN(dados.valorReferencia) ||
      dados.valorReferencia <= 0 ||
      dados.valorReferencia > MAX_VALOR_NUMERIC_PRODUTO
    ) {
      throw new Error(
        "O valor de referência deve estar entre R$ 0,01 e R$ 999.999,99."
      );
    }
  }

  if (dados.quantidadeMinima !== undefined && dados.quantidadeMinima !== null) {
    if (
      isNaN(dados.quantidadeMinima) ||
      dados.quantidadeMinima < 0 ||
      dados.quantidadeMinima > MAX_VALOR_NUMERIC_PRODUTO
    ) {
      throw new Error(
        "A quantidade mínima deve estar entre 0 e 999.999,99."
      );
    }
  }
}

export const produtoService = {
  listar: async (categoria?: string): Promise<ProdutoResponse[]> => {
    const params = categoria && categoria !== "Todos" ? { categoria } : {};
    const response = await api.get<ProdutoResponse[]>("/produtos", { params });
    return response.data;
  },

  buscarPorId: async (id: string): Promise<ProdutoResponse> => {
    const response = await api.get<ProdutoResponse>(`/produtos/${id}`);
    return response.data;
  },

  cadastrar: async (
    dados: ProdutoRequest,
    catalogoExistente: Pick<ProdutoResponse, "id" | "nome">[] = []
  ): Promise<ProdutoResponse> => {
    validarDadosProduto(dados, catalogoExistente);
    const response = await api.post<ProdutoResponse>("/produtos", {
      ...dados,
      nome: dados.nome.trim(),
      unidadeMedida: dados.unidadeMedida.trim(),
    });
    return response.data;
  },

  atualizarUnidadeMedida: async (id: string, unidadeMedida: string): Promise<ProdutoResponse> => {
    validarDadosProduto({ unidadeMedida });
    const response = await api.patch<ProdutoResponse>(`/produtos/${id}/unidade-medida`, {
      unidadeMedida: unidadeMedida.trim(),
    });
    return response.data;
  },

  atualizarQuantidadeMinima: async (id: string, quantidadeMinima: number): Promise<ProdutoResponse> => {
    validarDadosProduto({ quantidadeMinima });
    const response = await api.patch<ProdutoResponse>(`/produtos/${id}/quantidade-minima`, {
      quantidadeMinima,
    });
    return response.data;
  },

  atualizarControleValidade: async (id: string, controlaValidade: boolean): Promise<ProdutoResponse> => {
    const response = await api.patch<ProdutoResponse>(`/produtos/${id}/controle-validade`, {
      controlaValidade,
    });
    return response.data;
  },

  atualizarValorReferencia: async (id: string, valorReferencia: number | null): Promise<ProdutoResponse> => {
    validarDadosProduto({ valorReferencia });
    const response = await api.patch<ProdutoResponse>(`/produtos/${id}/valor-referencia`, {
      valorReferencia,
    });
    return response.data;
  },

  excluir: async (id: string): Promise<void> => {
    await api.delete(`/produtos/${id}`);
  },
};