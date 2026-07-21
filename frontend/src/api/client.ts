import axios, { type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

interface Tokens {
  access: string;
  refresh: string;
}

const STORAGE_KEY = "bezeta_tokens";

export function getTokens(): Tokens | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

export function setTokens(tokens: Tokens | null) {
  if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(STORAGE_KEY);
}

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers.set("Authorization", `Bearer ${tokens.access}`);
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;
  try {
    const { data } = await axios.post<{ access: string }>(`${API_URL}/auth/token/refresh/`, {
      refresh: tokens.refresh,
    });
    setTokens({ access: data.access, refresh: tokens.refresh });
    return data.access;
  } catch {
    setTokens(null);
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthEndpoint = original?.url?.includes("/auth/token/");

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const newAccess = await refreshing;
      if (newAccess) {
        original.headers.set("Authorization", `Bearer ${newAccess}`);
        return api(original);
      }
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);
