import { api } from "./client";
import type { Estado, Paginado, Tarea } from "../types";

export interface FiltrosTareas {
  estado?: Estado;
  periodo?: string;
  usuario?: number;
  vencida?: boolean;
}

export async function listarTareas(filtros: FiltrosTareas = {}): Promise<Tarea[]> {
  const { data } = await api.get<Paginado<Tarea> | Tarea[]>("/tareas/", { params: filtros });
  return Array.isArray(data) ? data : data.results;
}

export async function obtenerTarea(id: number): Promise<Tarea> {
  const { data } = await api.get<Tarea>(`/tareas/${id}/`);
  return data;
}

export interface CrearTareaPayload {
  catalogo: number;
  usuario: number;
  periodo: string;
  fecha_vencimiento: string;
  comentario_gerente?: string;
}

export async function crearTarea(payload: CrearTareaPayload): Promise<Tarea> {
  const { data } = await api.post<Tarea>("/tareas/", payload);
  return data;
}

export async function enviarARevision(id: number): Promise<Tarea> {
  const { data } = await api.post<Tarea>(`/tareas/${id}/enviar-a-revision/`);
  return data;
}

export async function validarTarea(
  id: number,
  estado: "entregado" | "parcial" | "no_logrado",
  comentario: string
): Promise<Tarea> {
  const { data } = await api.post<Tarea>(`/tareas/${id}/validar/`, { estado, comentario });
  return data;
}
