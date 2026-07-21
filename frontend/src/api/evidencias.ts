import { api } from "./client";
import type { Evidencia, Paginado } from "../types";

export async function listarEvidenciasDeTarea(tareaId: number): Promise<Evidencia[]> {
  const { data } = await api.get<Paginado<Evidencia> | Evidencia[]>("/evidencias/", {
    params: { tarea: tareaId },
  });
  return Array.isArray(data) ? data : data.results;
}

export async function subirEvidencia(
  tareaId: number,
  archivo: File,
  comentario: string
): Promise<Evidencia> {
  const formData = new FormData();
  formData.append("tarea", String(tareaId));
  formData.append("archivo", archivo);
  if (comentario) formData.append("comentario", comentario);
  const { data } = await api.post<Evidencia>("/evidencias/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
