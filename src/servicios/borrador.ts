import {
  eliminarBorradorDeSQLite,
  guardarBorradorEnSQLite,
  leerBorradorDesdeSQLite,
} from "@/servicios/base-datos";
import { BorradorEnCurso, DatosBorradorReporte } from "@/tipos";

export const PASOS_REPORTE = 5;

const vacio: BorradorEnCurso = {
  tipoId: "",
  descripcion: "",
  direccion: "",
  latitud: null,
  longitud: null,
  fotos: [],
  audioUrl: null,
  paso: 1,
  pendienteEnvio: false,
  adherirAId: null,
};

let actual: BorradorEnCurso = { ...vacio, fotos: [] };

export async function hidratarBorradorDesdeSQLite(): Promise<BorradorEnCurso> {
  try {
    const guardado = await leerBorradorDesdeSQLite();
    if (guardado) {
      actual = {
        ...guardado,
        fotos: [...guardado.fotos],
      };
    }
  } catch {
    // Si SQLite no está disponible aún, mantiene el estado en memoria
  }
  return leerBorrador();
}

export function leerBorrador(): BorradorEnCurso {
  return {
    ...actual,
    fotos: [...actual.fotos],
  };
}

export function actualizarBorrador(parcial: Partial<BorradorEnCurso>) {
  actual = {
    ...actual,
    ...parcial,
    fotos: parcial.fotos ? [...parcial.fotos] : [...actual.fotos],
  };
  void guardarBorradorEnSQLite(actual).catch(() => {});
}

export function iniciarBorradorNuevo() {
  actual = { ...vacio, fotos: [] };
  void eliminarBorradorDeSQLite().catch(() => {});
}

export function limpiarBorrador() {
  iniciarBorradorNuevo();
}

export function marcarPendienteEnvio() {
  actual = { ...actual, pendienteEnvio: true, adherirAId: null };
  void guardarBorradorEnSQLite(actual).catch(() => {});
}

export function marcarAdhesionPendiente(reporteId: string) {
  actual = { ...actual, adherirAId: reporteId, pendienteEnvio: false };
  void guardarBorradorEnSQLite(actual).catch(() => {});
}

export function limpiarAdhesionPendiente() {
  actual = { ...actual, adherirAId: null };
  void guardarBorradorEnSQLite(actual).catch(() => {});
}

export function borradorListoParaEnviar(
  borrador: BorradorEnCurso = actual,
): DatosBorradorReporte | null {
  if (
    !borrador.pendienteEnvio ||
    !borrador.tipoId ||
    borrador.fotos.length < 1 ||
    borrador.latitud == null ||
    borrador.longitud == null ||
    borrador.direccion.trim().length < 5
  ) {
    return null;
  }

  return {
    tipoId: borrador.tipoId,
    descripcion: borrador.descripcion,
    direccion: borrador.direccion.trim(),
    latitud: borrador.latitud,
    longitud: borrador.longitud,
    fotos: [...borrador.fotos],
    audioUrl: borrador.audioUrl,
  };
}