import { api, setTokens } from "./client";
import type { Usuario } from "../types";

export async function login(email: string, password: string): Promise<Usuario> {
  const { data } = await api.post<{ access: string; refresh: string }>("/auth/token/", {
    email,
    password,
  });
  setTokens({ access: data.access, refresh: data.refresh });
  const me = await api.get<Usuario>("/usuarios/me/");
  return me.data;
}

export function logout() {
  setTokens(null);
}

export async function obtenerUsuarioActual(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/usuarios/me/");
  return data;
}
