export type Rol = "gerente" | "colaborador" | "direccion";

export interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: Rol;
  cargo: number | null;
  cargo_nombre?: string;
  is_active: boolean;
}

export type Estado = "pendiente" | "en_revision" | "parcial" | "entregado" | "no_logrado";

export const ESTADOS_FINALES: Estado[] = ["entregado", "parcial", "no_logrado"];

export interface HistorialEstado {
  id: number;
  estado_anterior: string;
  estado_nuevo: Estado;
  usuario: number | null;
  usuario_nombre: string;
  comentario: string;
  fecha: string;
}

export interface Tarea {
  id: number;
  catalogo: number;
  catalogo_nombre: string;
  cargo_codigo: string;
  usuario: number;
  usuario_nombre: string;
  periodo: string;
  fecha_vencimiento: string | null;
  estado: Estado;
  vencida: boolean;
  creada_por: number | null;
  comentario_gerente: string;
  creada_en: string;
  actualizada_en: string;
  historial: HistorialEstado[];
}

export interface CatalogoTarea {
  id: number;
  cargo: number;
  cargo_codigo: string;
  nombre: string;
  descripcion: string;
  periodicidad: "diaria" | "semanal" | "mensual" | "trimestral" | "anual";
  peso_kpi: string;
  activo: boolean;
}

export interface Cargo {
  id: number;
  codigo: string;
  nombre: string;
  area: string;
  objetivo: string;
  reemplazado_por: number | null;
  activo: boolean;
}

export interface Evidencia {
  id: number;
  tarea: number;
  archivo: string;
  nombre_archivo: string;
  comentario: string;
  subido_por: number | null;
  subido_por_nombre: string;
  fecha_subida: string;
  anulada: boolean;
}

export interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
