import axios from "axios";
import {
  getToken,
  obterCsrfToken,
  tratarSessaoExpiradaSe401,
} from "./authSession";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.withCredentials = true;

  if (typeof window !== "undefined") {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const csrf = obterCsrfToken();
    if (csrf) {
      config.headers["X-XSRF-TOKEN"] = csrf;
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
