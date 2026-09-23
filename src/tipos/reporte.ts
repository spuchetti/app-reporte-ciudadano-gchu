import { Coordenadas, EstadoReporte, Foto } from "./common";

export interface Reporte {
  id: string;
  codigo: string;
  tipoId: string;
  descripcion: string | null;
  audioUrl: string | null;
  fotos: Foto[];
  coordenadas: Coordenadas;
  direccion: string;
  zonaId: string;
  estado: EstadoReporte;
  autorId: string;
  cuadrillaId: string | null;
  duplicadoDe: string | null;
  fotoArreglo: Foto | null;
  adhesiones: number;
  creadoEn: string;
  sincronizado: boolean;
}

export interface TipoDeReporte {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  areaResponsable: string;
}

/** Datos del reporte listos para enviar (foto y ubicación incluidas). */
export interface DatosBorradorReporte {
  tipoId: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  fotos: string[];
  audioUrl: string | null;
}

/** Borrador mientras el vecino recorre los pasos. */
export interface BorradorEnCurso {
  tipoId: string;
  descripcion: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  fotos: string[];
  audioUrl: string | null;
  paso: number;
  pendienteEnvio: boolean;
  adherirAId: string | null;
}

export interface CambioDeEstado {
  id: string;
  reporteId: string;
  estado: EstadoReporte;
  comentario: string | null;
  operadorId: string | null;
  fechaHora: string;
}
