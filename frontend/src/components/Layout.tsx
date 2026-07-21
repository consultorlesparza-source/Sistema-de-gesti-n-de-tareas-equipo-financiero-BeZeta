import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROL_LABEL: Record<string, string> = {
  gerente: "Gerente de Finanzas",
  colaborador: "Colaborador",
  direccion: "Dirección General",
};

export function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="brand-mark">BeZeta</span>
          <span className="brand-sub">Gestión de Tareas y KPIs</span>
        </div>
        <div className="app-header-user">
          <div className="user-info">
            <span className="user-name">{usuario?.first_name || usuario?.username}</span>
            <span className="user-role">{usuario ? ROL_LABEL[usuario.rol] : ""}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
