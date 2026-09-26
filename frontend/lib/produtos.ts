import { api } from "./api";

export interface ProdutoResponse {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  valorReferencia: number;
  quantidadeMinima?: number;
  controlaValidade?: boolean;
  saldoTotal: number;
}

export interface ProdutoRequest {
  nome: string;
  categoria: string;
  unidadeMedida: string;
  valorReferencia: number;
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

  cadastrar: async (dados: ProdutoRequest): Promise<ProdutoResponse> => {
    const response = await api.post<ProdutoResponse>("/produtos", dados);
    return response.data;
  },

  atualizarUnidadeMedida: async (id: string, unidadeMedida: string): Promise<ProdutoResponse> => {
    const response = await api.patch<ProdutoResponse>(`/produtos/${id}/unidade-medida`, {
      unidadeMedida,
    });
    return response.data;
  },

  atualizarQuantidadeMinima: async (id: string, quantidadeMinima: number): Promise<ProdutoResponse> => {
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

  atualizarValorReferencia: async (id: string, valorReferencia: number): Promise<ProdutoResponse> => {
    const response = await api.patch<ProdutoResponse>(`/produtos/${id}/valor-referencia`, {
      valorReferencia,
    });
    return response.data;
  },
};