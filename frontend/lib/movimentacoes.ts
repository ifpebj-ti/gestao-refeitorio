// export interface MovimentacaoEntradaRequest {
//   produtoId: string;
//   localId: string;
//   quantidade: number;
//   data: string; // YYYY-MM-DD
//   origem: "EXTERNA" | "AGROINDUSTRIA" | "INTERNA";
//   valor: number;
// }

// export interface MovimentacaoResponse {
//   id: string;
//   produtoId: string;
//   localId: string;
//   tipo: "ENTRADA" | "SAIDA";
//   quantidade: number;
//   data: string;
//   origem: string;
//   valor: number;
// }

// export const registrarEntradaApi = async (
//   dados: MovimentacaoEntradaRequest,
//   arquivoFoto?: File | null
// ): Promise<MovimentacaoResponse> => {
//   const token = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:token") : null;

//   if (!token) {
//     alert("ERRO: Token de autenticação não encontrado no navegador! Faça login novamente.");
//     throw new Error("Token não encontrado");
//   }

//   const url = "http://localhost:8080/api/movimentacoes/entrada";
  
//   console.log(">>> Enviando POST para:", url, dados);

//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(dados),
//   });

//   if (!res.ok) {
//     const errorText = await res.text();
//     console.error(">>> Resposta de erro do backend:", res.status, errorText);
//     alert(`ERRO HTTP ${res.status}: ${errorText || "Falha na requisição"}`);
//     throw new Error(`Erro na API (${res.status}): ${errorText}`);
//   }

//   const movimentacaoCriada: MovimentacaoResponse = await res.json();
//   console.log(">>> Movimentação criada com sucesso:", movimentacaoCriada);

//   if (arquivoFoto && movimentacaoCriada?.id) {
//     const formData = new FormData();
//     formData.append("arquivo", arquivoFoto);
//     await fetch(`http://localhost:8080/api/movimentacoes/${movimentacaoCriada.id}/foto`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       body: formData,
//     });
//   }

//   return movimentacaoCriada;
// };

export interface MovimentacaoEntradaRequest {
  produtoId: string;
  localId: string;
  quantidade: number;
  data: string; // YYYY-MM-DD
  origem: "EXTERNA" | "AGROINDUSTRIA" | "INTERNA";
  valor: number;
}

export interface MovimentacaoResponse {
  id: string;
  produtoId: string;
  localId: string;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: number;
  data: string;
  origem: string;
  valor: number;
  tipoSaida?: string;
}

export const registrarEntradaApi = async (
  dados: MovimentacaoEntradaRequest,
  arquivoFoto?: File | null
): Promise<MovimentacaoResponse> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:token") : null;

  if (!token) {
    alert("ERRO: Token de autenticação não encontrado no navegador! Faça login novamente.");
    throw new Error("Token não encontrado");
  }

  const url = "http://localhost:8080/api/movimentacoes/entrada";
  
  console.log(">>> Enviando POST para:", url, dados);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(">>> Resposta de erro do backend:", res.status, errorText);
    alert(`ERRO HTTP ${res.status}: ${errorText || "Falha na requisição"}`);
    throw new Error(`Erro na API (${res.status}): ${errorText}`);
  }

  const movimentacaoCriada: MovimentacaoResponse = await res.json();
  console.log(">>> Movimentação criada com sucesso:", movimentacaoCriada);

  if (arquivoFoto && movimentacaoCriada?.id) {
    const formData = new FormData();
    formData.append("arquivo", arquivoFoto);
    await fetch(`http://localhost:8080/api/movimentacoes/${movimentacaoCriada.id}/foto`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  }

  return movimentacaoCriada;
};

export const listarHistoricoApi = async (): Promise<MovimentacaoResponse[]> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("@gestao_refeitorio:token") : null;
  if (!token) throw new Error("Token não encontrado");

  const url = "http://localhost:8080/api/movimentacoes";
  
  console.log(">>> 1. Frontend chamando a API de histórico...");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store", // Isso FORÇA o navegador a não usar cache!
  });

  if (!res.ok) {
    const errorText = await res.text();
    alert(`ERRO DO BACKEND (HTTP ${res.status}): \n${errorText}`);
    throw new Error(`Erro ao buscar histórico: ${res.status}`);
  }

  const json = await res.json();
  console.log(">>> 2. Dados reais que chegaram do Banco de Dados:", json);
  
  return json;
};