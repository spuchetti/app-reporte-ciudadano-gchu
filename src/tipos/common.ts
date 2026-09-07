export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export type EstadoReporte =
  | "recibido"
  | "en_revision"
  | "asignado"
  | "resuelto"
  | "rechazado";

export interface Foto {
  id: string;
  url: string;
  esPrincipal: boolean;
}
