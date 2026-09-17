import { cambiosEstadoMock, reportesMock, tiposReporteMock } from "@/mocks";
import { ErrorServicio } from "@/servicios/error";
import {
  CambioDeEstado,
  DatosBorradorReporte,
  Reporte,
  TipoDeReporte,
} from "@/tipos";

const COORDENADAS_CENTRO = { latitud: -33.0156, longitud: -58.5089 };
const ZONA_POR_DEFECTO = "zon-centro";

// Simular delay de red
const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Obtener todos los reportes
export const obtenerReportes = async (): Promise<Reporte[]> => {
  await delay(600);
  return [...reportesMock];
};

// Obtener un reporte por ID
export const obtenerReportePorId = async (
  id: string,
): Promise<Reporte | null> => {
  await delay(400);
  const reporte = reportesMock.find((r) => r.id === id);
  return reporte || null;
};

// Obtener reportes por autor
export const obtenerReportesPorAutor = async (
  autorId: string,
): Promise<Reporte[]> => {
  await delay(500);
  return reportesMock.filter((r) => r.autorId === autorId);
};

// Obtener reportes por zona
export const obtenerReportesPorZona = async (
  zonaId: string,
): Promise<Reporte[]> => {
  await delay(500);
  return reportesMock.filter((r) => r.zonaId === zonaId);
};

export function validarBorradorReporte(borrador: DatosBorradorReporte) {
  if (!tiposReporteMock.some((tipo) => tipo.id === borrador.tipoId)) {
    throw new ErrorServicio({
      codigo: "TIPO_INVALIDO",
      mensaje: "Elegí el tipo de problema.",
    });
  }

  if (borrador.direccion.trim().length < 5) {
    throw new ErrorServicio({
      codigo: "DIRECCION_INVALIDA",
      mensaje: "Ingresá la dirección.",
    });
  }
}

export function datosCreacionDesdeBorrador(
  borrador: DatosBorradorReporte,
  autorId: string,
): Omit<Reporte, "id" | "codigo" | "creadoEn"> {
  validarBorradorReporte(borrador);

  return {
    tipoId: borrador.tipoId,
    descripcion: borrador.descripcion.trim() || null,
    audioUrl: null,
    fotos: [],
    coordenadas: COORDENADAS_CENTRO,
    direccion: borrador.direccion.trim(),
    zonaId: ZONA_POR_DEFECTO,
    estado: "recibido",
    autorId,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    sincronizado: false,
  };
}

// Crear un nuevo reporte
export const crearReporte = async (
  reporte: Omit<Reporte, "id" | "codigo" | "creadoEn">,
): Promise<Reporte> => {
  await delay(800);

  const nuevoReporte: Reporte = {
    ...reporte,
    id: `rep-${String(reportesMock.length + 1).padStart(3, "0")}`,
    codigo: `GCHU-2026-${String(reportesMock.length + 1).padStart(5, "0")}`,
    creadoEn: new Date().toISOString(),
  };

  // En un mock, agregamos al array (en la vida real, esto sería una API)
  reportesMock.push(nuevoReporte);

  return nuevoReporte;
};

// Obtener tipos de reporte
export const obtenerTiposReporte = async (): Promise<TipoDeReporte[]> => {
  await delay(300);
  return [...tiposReporteMock];
};

// Obtener cambios de estado de un reporte
export const obtenerCambiosEstado = async (
  reporteId: string,
): Promise<CambioDeEstado[]> => {
  await delay(400);
  return cambiosEstadoMock.filter((c) => c.reporteId === reporteId);
};

// Actualizar estado de un reporte
export const actualizarEstado = async (
  reporteId: string,
  nuevoEstado: Reporte["estado"],
  comentario: string,
  operadorId: string,
): Promise<CambioDeEstado> => {
  await delay(600);

  // Buscar el reporte y actualizar su estado
  const reporte = reportesMock.find((r) => r.id === reporteId);
  if (reporte) {
    reporte.estado = nuevoEstado;
  }

  const nuevoCambio: CambioDeEstado = {
    id: `cambio-${String(cambiosEstadoMock.length + 1).padStart(3, "0")}`,
    reporteId,
    estado: nuevoEstado,
    comentario,
    operadorId,
    fechaHora: new Date().toISOString(),
  };

  cambiosEstadoMock.push(nuevoCambio);

  return nuevoCambio;
};
