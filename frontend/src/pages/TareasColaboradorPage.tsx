import { useEffect, useState, type FormEvent } from "react";
import { EstadoBadge } from "../components/EstadoBadge";
import { listarTareas, enviarARevision } from "../api/tareas";
import { listarEvidenciasDeTarea, subirEvidencia } from "../api/evidencias";
import type { Evidencia, Tarea } from "../types";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TareasColaboradorPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandidaId, setExpandidaId] = useState<number | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const data = await listarTareas();
      setTareas(data);
    } catch {
      setError("No se pudieron cargar tus tareas.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function onCambio(actualizada: Tarea) {
    setTareas((prev) => prev.map((t) => (t.id === actualizada.id ? actualizada : t)));
  }

  if (cargando) return <div className="pagina-cargando">Cargando tus tareas…</div>;
  if (error) return <p className="mensaje-error">{error}</p>;

  const pendientes = tareas.filter((t) => t.estado === "pendiente" || t.estado === "en_revision");
  const cerradas = tareas.filter((t) => t.estado !== "pendiente" && t.estado !== "en_revision");

  return (
    <div className="pagina">
      <h1>Mis tareas</h1>
      <p className="pagina-subtitulo">
        Sube tu evidencia y marca la tarea "En revisión" cuando la hayas completado. El Gerente de
        Finanzas confirmará el estado final.
      </p>

      {tareas.length === 0 && <p className="estado-vacio">No tienes tareas asignadas por ahora.</p>}

      {pendientes.length > 0 && (
        <section className="seccion">
          <h2>Por trabajar</h2>
          <div className="lista-tareas">
            {pendientes.map((tarea) => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                expandida={expandidaId === tarea.id}
                onToggle={() => setExpandidaId(expandidaId === tarea.id ? null : tarea.id)}
                onCambio={onCambio}
              />
            ))}
          </div>
        </section>
      )}

      {cerradas.length > 0 && (
        <section className="seccion">
          <h2>Historial del periodo</h2>
          <div className="lista-tareas">
            {cerradas.map((tarea) => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                expandida={expandidaId === tarea.id}
                onToggle={() => setExpandidaId(expandidaId === tarea.id ? null : tarea.id)}
                onCambio={onCambio}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TareaCard({
  tarea,
  expandida,
  onToggle,
  onCambio,
}: {
  tarea: Tarea;
  expandida: boolean;
  onToggle: () => void;
  onCambio: (t: Tarea) => void;
}) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [cargandoEvidencias, setCargandoEvidencias] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comentario, setComentario] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expandida) return;
    setCargandoEvidencias(true);
    listarEvidenciasDeTarea(tarea.id)
      .then(setEvidencias)
      .catch(() => setError("No se pudieron cargar las evidencias."))
      .finally(() => setCargandoEvidencias(false));
  }, [expandida, tarea.id]);

  async function onSubirEvidencia(e: FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const nueva = await subirEvidencia(tarea.id, archivo, comentario);
      setEvidencias((prev) => [nueva, ...prev]);
      setArchivo(null);
      setComentario("");
    } catch (err: unknown) {
      const detalle = extraerMensajeError(err);
      setError(detalle ?? "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  }

  async function onEnviarARevision() {
    setError(null);
    setEnviando(true);
    try {
      const actualizada = await enviarARevision(tarea.id);
      onCambio(actualizada);
    } catch (err: unknown) {
      const detalle = extraerMensajeError(err);
      setError(detalle ?? "No se pudo enviar la tarea a revisión.");
    } finally {
      setEnviando(false);
    }
  }

  const puedeEditar = tarea.estado === "pendiente";

  return (
    <article className={`tarea-card ${tarea.vencida ? "tarea-card-vencida" : ""}`}>
      <button type="button" className="tarea-card-cabecera" onClick={onToggle}>
        <div>
          <h3>{tarea.catalogo_nombre}</h3>
          <p className="tarea-meta">
            Periodo {tarea.periodo} · Vence {formatearFecha(tarea.fecha_vencimiento)}
          </p>
        </div>
        <EstadoBadge estado={tarea.estado} vencida={tarea.vencida} />
      </button>

      {expandida && (
        <div className="tarea-card-cuerpo">
          {tarea.comentario_gerente && (
            <p className="comentario-gerente">
              <strong>Comentario del Gerente:</strong> {tarea.comentario_gerente}
            </p>
          )}

          <h4>Evidencia</h4>
          {cargandoEvidencias && <p>Cargando evidencia…</p>}
          {!cargandoEvidencias && evidencias.length === 0 && (
            <p className="estado-vacio">Aún no has subido evidencia.</p>
          )}
          <ul className="lista-evidencias">
            {evidencias.map((ev) => (
              <li key={ev.id} className={ev.anulada ? "evidencia-anulada" : ""}>
                <a href={ev.archivo} target="_blank" rel="noreferrer">
                  {ev.nombre_archivo}
                </a>
                {ev.comentario && <span className="evidencia-comentario"> — {ev.comentario}</span>}
                {ev.anulada && <span className="badge badge-vencida">Anulada</span>}
              </li>
            ))}
          </ul>

          {puedeEditar && (
            <form className="form-evidencia" onSubmit={onSubirEvidencia}>
              <input
                type="file"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
              />
              <input
                type="text"
                placeholder="Comentario (opcional)"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              <button type="submit" className="btn btn-secundario" disabled={!archivo || subiendo}>
                {subiendo ? "Subiendo…" : "Subir evidencia"}
              </button>
            </form>
          )}

          {error && <p className="mensaje-error">{error}</p>}

          {puedeEditar && (
            <button
              type="button"
              className="btn btn-primario"
              onClick={onEnviarARevision}
              disabled={enviando || evidencias.filter((e) => !e.anulada).length === 0}
            >
              {enviando ? "Enviando…" : "Enviar a revisión"}
            </button>
          )}

          {tarea.historial.length > 0 && (
            <details className="historial">
              <summary>Historial de estados</summary>
              <ul>
                {tarea.historial.map((h) => (
                  <li key={h.id}>
                    <strong>{h.estado_nuevo}</strong> — {h.usuario_nombre || "Sistema"} (
                    {new Date(h.fecha).toLocaleString("es-CL")})
                    {h.comentario && <> — {h.comentario}</>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </article>
  );
}

function extraerMensajeError(err: unknown): string | null {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: unknown } }).response === "object"
  ) {
    const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
    if (!data) return null;
    const primerValor = Object.values(data)[0];
    if (Array.isArray(primerValor)) return String(primerValor[0]);
    if (typeof primerValor === "string") return primerValor;
  }
  return null;
}
