import { api } from "./client";
import type { CatalogoTarea, Paginado } from "../types";

export async function listarCatalogo(): Promise<CatalogoTarea[]> {
  const { data } = await api.get<Paginado<CatalogoTarea> | CatalogoTarea[]>("/catalogo-tareas/", {
    params: { activo: true },
  });
  return Array.isArray(data) ? data : data.results;
}
