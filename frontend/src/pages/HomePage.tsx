import { useAuth } from "../context/AuthContext";
import { TareasColaboradorPage } from "./TareasColaboradorPage";
import { TareasGerentePage } from "./TareasGerentePage";

export function HomePage() {
  const { usuario } = useAuth();

  if (usuario?.rol === "colaborador") return <TareasColaboradorPage />;
  return <TareasGerentePage />;
}
