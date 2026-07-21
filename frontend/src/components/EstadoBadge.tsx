import type { Estado } from "../types";

const CONFIG: Record<Estado, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "badge badge-pendiente" },
  en_revision: { label: "En revisión", className: "badge badge-revision" },
  parcial: { label: "Parcialmente entregado", className: "badge badge-parcial" },
  entregado: { label: "Entregado", className: "badge badge-entregado" },
  no_logrado: { label: "No logrado", className: "badge badge-no-logrado" },
};

export function EstadoBadge({ estado, vencida }: { estado: Estado; vencida?: boolean }) {
  const cfg = CONFIG[estado];
  return (
    <span className="badge-group">
      <span className={cfg.className}>{cfg.label}</span>
      {vencida && <span className="badge badge-vencida">Vencida</span>}
    </span>
  );
}
