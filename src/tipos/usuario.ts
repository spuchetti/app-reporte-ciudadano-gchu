export type Rol = "vecino" | "operador";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Rol;
  zonaId: string | null;
  avisosActivos: boolean;
  creadoEn: string;
}
