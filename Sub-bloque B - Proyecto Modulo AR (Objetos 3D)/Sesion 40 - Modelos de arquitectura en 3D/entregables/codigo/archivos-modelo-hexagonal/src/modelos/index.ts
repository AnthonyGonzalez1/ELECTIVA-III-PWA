// index.ts — catálogo de modelos del Atlas 3D (Sesión 40).
import type { DefinicionModelo } from "./tipos";
import { MVC } from "./mvc";
import { CAPAS } from "./capas";
import { MICROSERVICIOS } from "./microservicios";
import { HEXAGONAL } from "./hexagonal"; // actividad 40.1

export const CATALOGO: DefinicionModelo[] = [MVC, CAPAS, MICROSERVICIOS, HEXAGONAL];

export function modeloPorId(id: string): DefinicionModelo | undefined {
  return CATALOGO.find((m) => m.id === id);
}
