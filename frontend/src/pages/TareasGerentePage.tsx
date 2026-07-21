import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EstadoBadge } from "../components/EstadoBadge";
import { crearTarea, listarTareas, validarTarea, type FiltrosTareas } from "../api/tareas";
import { listarCatalogo } from "../api/catalogo";
import { listarUsuarios } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import type { CatalogoTarea, Estado, Tarea, Usuario } from "../types";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ESTADOS: { value: Estado | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "parcial", label: "Parcialmente entregado" },
  { value: "entregado", label: "Entregado" },
  { value: "no_logrado", label: "No logrado" },
];

export function TareasGerentePage() {
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === "gerente";
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoTarea[]>([]);
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<Estado | "">("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  async function cargarTareas(filtros: FiltrosTareas = {}) {
    setCargando(true);
    setError(null);
    try {
      const data = await listarTareas(filtros);
      setTareas(data);
    } catch {
      setError("No se pudieron cargar las tareas del equipo.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTareas();
    listarCatalogo().then(setCatalogo).catch(() => {});
    if (esGerente) {
      listarUsuarios()
        .then((us) => setColaboradores(us.filter((u) => u.rol === "colaborador")))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarTareas(filtroEstado ? { estado: filtroEstado } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  function onCreada(nueva: Tarea) {
    setTareas((prev) => [nueva, ...prev]);
    setMostrarFormulario(false);
  }

  function onValidada(actualizada: Tarea) {
    setTareas((prev) => prev.map((t) => (t.id === actualizada.id ? actualizada : t)));
  }

  const resumen = useMemo(() => {
    const total = tareas.length;
    const enRevision = tareas.filter((t) => t.estado === "en_revision").length;
    const vencidas = tareas.filter((t) => t.vencida).length;
    return { total, enRevision, vencidas };
  }, [tareas]);

  return (
    <div className="pagina">
      <div className="pagina-cabecera">
        <div>
          <h1>Tareas del equipo</h1>
          <p className="pagina-subtitulo">
            {resumen.total} tareas · {resumen.enRevision} en revisión · {resumen.vencidas} vencidas
          </p>
        </div>
        {esGerente && (
          <button type="button" className="btn btn-primario" onClick={() => setMostrarFormulario((v) => !v)}>
            {mostrarFormulario ? "Cancelar" : "Nueva tarea"}
          </button>
        )}
      </div>

      {esGerente && mostrarFormulario && (
        <NuevaTareaForm catalogo={catalogo} colaboradores={colaboradores} onCreada={onCreada} />
      )}

      <div className="filtros">
        <label>
          Estado
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as Estado | "")}>
            {ESTADOS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {cargando && <div className="pagina-cargando">Cargando…</div>}
      {error && <p className="mensaje-error">{error}</p>}

      {!cargando && tareas.length === 0 && <p className="estado-vacio">No hay tareas con este filtro.</p>}

      <div className="tabla-tareas">
        {tareas.map((tarea) => (
          <FilaTarea key={tarea.id} tarea={tarea} onValidada={onValidada} puedeValidar={esGerente} />
        ))}
      </div>
    </div>
  );
}

function NuevaTareaForm({
  catalogo,
  colaboradores,
  onCreada,
}: {
  catalogo: CatalogoTarea[];
  colaboradores: Usuario[];
  onCreada: (t: Tarea) => void;
}) {
  const [catalogoId, setCatalogoId] = useState<number | "">("");
  const [usuarioId, setUsuarioId] = useState<number | "">("");
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7));
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!catalogoId || !usuarioId || !fechaVencimiento) return;
    setEnviando(true);
    setError(null);
    try {
      const nueva = await crearTarea({
        catalogo: Number(catalogoId),
        usuario: Number(usuarioId),
        periodo,
        fecha_vencimiento: fechaVencimiento,
      });
      onCreada(nueva);
    } catch {
      setError("No se pudo crear la tarea. Revisa que no exista ya para ese colaborador y periodo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta form-nueva-tarea" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          Tarea (catálogo)
          <select value={catalogoId} onChange={(e) => setCatalogoId(Number(e.target.value) || "")} required>
            <option value="">Selecciona…</option>
            {catalogo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cargo_codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Colaborador
          <select value={usuarioId} onChange={(e) => setUsuarioId(Number(e.target.value) || "")} required>
            <option value="">Selecciona…</option>
            {colaboradores.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name || u.username} ({u.email})
              </option>
            ))}
          </select>
        </label>

        <label>
          Periodo (AAAA-MM)
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
        </label>

        <label>
          Fecha de vencimiento
          <input
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            required
          />
        </label>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <button type="submit" className="btn btn-primario" disabled={enviando}>
        {enviando ? "Creando…" : "Crear y asignar tarea"}
      </button>
    </form>
  );
}

function FilaTarea({
  tarea,
  onValidada,
  puedeValidar,
}: {
  tarea: Tarea;
  onValidada: (t: Tarea) => void;
  puedeValidar: boolean;
}) {
  const [abierta, setAbierta] = useState(false);
  const [estadoElegido, setEstadoElegido] = useState<"entregado" | "parcial" | "no_logrado">("entregado");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onValidar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const actualizada = await validarTarea(tarea.id, estadoElegido, comentario);
      onValidada(actualizada);
      setAbierta(false);
      setComentario("");
    } catch {
      setError("No se pudo validar la tarea.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <article className={`fila-tarea ${tarea.vencida ? "fila-tarea-vencida" : ""}`}>
      <div className="fila-tarea-info">
        <div>
          <strong>{tarea.catalogo_nombre}</strong>
          <p className="tarea-meta">
            {tarea.usuario_nombre} · {tarea.cargo_codigo} · Periodo {tarea.periodo} · Vence{" "}
            {formatearFecha(tarea.fecha_vencimiento)}
          </p>
        </div>
        <EstadoBadge estado={tarea.estado} vencida={tarea.vencida} />
      </div>

      {puedeValidar && tarea.estado === "en_revision" && (
        <div className="fila-tarea-acciones">
          <button type="button" className="btn btn-secundario" onClick={() => setAbierta((v) => !v)}>
            {abierta ? "Cancelar" : "Validar"}
          </button>
        </div>
      )}

      {abierta && (
        <form className="form-validar" onSubmit={onValidar}>
          <select
            value={estadoElegido}
            onChange={(e) => setEstadoElegido(e.target.value as typeof estadoElegido)}
          >
            <option value="entregado">Entregado</option>
            <option value="parcial">Parcialmente entregado</option>
            <option value="no_logrado">No logrado</option>
          </select>
          <input
            type="text"
            placeholder="Comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Guardando…" : "Confirmar"}
          </button>
          {error && <p className="mensaje-error">{error}</p>}
        </form>
      )}
    </article>
  );
}
