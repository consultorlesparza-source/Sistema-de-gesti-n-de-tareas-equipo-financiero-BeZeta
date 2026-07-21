import { api } from "./client";
import type { Paginado, Usuario } from "../types";

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Paginado<Usuario> | Usuario[]>("/usuarios/");
  return Array.isArray(data) ? data : data.results;
}
