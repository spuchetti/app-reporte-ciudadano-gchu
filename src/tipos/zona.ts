import { Coordenadas } from "./common";

export interface Zona {
  id: string;
  nombre: string;
  referente: string;
  limite: Coordenadas[];
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  zonaId: string;
  especialidad: string;
  activa: boolean;
}
