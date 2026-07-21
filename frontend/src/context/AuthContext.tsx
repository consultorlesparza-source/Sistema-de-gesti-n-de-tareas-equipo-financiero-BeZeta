import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getTokens, setTokens } from "../api/client";
import { login as loginRequest, logout as logoutRequest, obtenerUsuarioActual } from "../api/auth";
import type { Usuario } from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tokens = getTokens();
    if (!tokens) {
      setCargando(false);
      return;
    }
    obtenerUsuarioActual()
      .then(setUsuario)
      .catch(() => setTokens(null))
      .finally(() => setCargando(false));
  }, []);

  async function login(email: string, password: string) {
    const u = await loginRequest(email, password);
    setUsuario(u);
  }

  function logout() {
    logoutRequest();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
