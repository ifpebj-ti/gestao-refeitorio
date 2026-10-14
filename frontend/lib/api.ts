import axios from "axios";
import {
  STORAGE_TOKEN_KEY,
  isTokenExpirado,
  limparSessaoLocal,
  notificarSessaoExpirada,
  tratarSessaoExpiradaSe401,
} from "./authSession";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (token) {
      if (isTokenExpirado(token)) {
        limparSessaoLocal();
        notificarSessaoExpirada();
        return Promise.reject(new axios.Cancel("Sessão expirada. Faça login novamente."));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      tratarSessaoExpiradaSe401(401);
    }
    return Promise.reject(error);
  }
);