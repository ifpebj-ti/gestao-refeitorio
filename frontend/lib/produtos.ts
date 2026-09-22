import { api } from "./api";

export interface ProdutoResponse {
  id: string;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  valorReferencia: number;
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
    // Alterado de /api/produtos para /produtos pois baseURL ja tem /api
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
};