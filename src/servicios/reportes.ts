import {
  cambiosEstadoMock,
  cuadrillasMock,
  reportesMock,
  tiposReporteMock,
} from "@/mocks";
import { ErrorServicio } from "@/servicios/error";
import { zonaParaCoordenadas } from "@/servicios/ubicacion";
import {
  CambioDeEstado,
  DatosBorradorReporte,
  EstadoReporte,
  Reporte,
  TipoDeReporte,
} from "@/tipos";

export { COORDENADAS_CENTRO } from "@/servicios/ubicacion";
export const ZONA_POR_DEFECTO = "zon-centro";

const ETIQUETA_ESTADO: Record<EstadoReporte, string> = {
  recibido: "recibido",
  en_revision: "en revisión",
  asignado: "asignado",
  resuelto: "resuelto",
  rechazado: "rechazado",
};

export type AvisoDeEstado = {
  id: string;
  reporteId: string;
  codigo: string;
  tipoNombre: string;
  estado: EstadoReporte;
  comentario: string | null;
  fechaHora: string;
};

export function etiquetaEstado(estado: EstadoReporte) {
  return ETIQUETA_ESTADO[estado];
}

export function resumenReportesCerca(cantidad: number) {
  if (cantidad <= 0) {
    return "No hay reportes cerca tuyo";
  }
  if (cantidad === 1) {
    return "Hay 1 reporte cerca tuyo";
  }
  return `Hay ${cantidad} reportes cerca tuyo`;
}

export function ultimosReportesPublicos(reportes: Reporte[], limite = 3) {
  return [...reportes]
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    .slice(0, limite);
}

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
  if (!zonaId) {
    return [];
  }
  return reportesMock.filter((r) => r.zonaId === zonaId);
};

export const obtenerAvisosDeEstado = async (
  autorId: string,
): Promise<AvisoDeEstado[]> => {
  await delay(300);
  if (!autorId) {
    return [];
  }

  const propios = reportesMock.filter((reporte) => reporte.autorId === autorId);
  const porId = new Map(propios.map((reporte) => [reporte.id, reporte]));

  return cambiosEstadoMock
    .filter((cambio) => porId.has(cambio.reporteId) && cambio.operadorId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
    .slice(0, 3)
    .map((cambio) => {
      const reporte = porId.get(cambio.reporteId)!;
      const tipo = tiposReporteMock.find((item) => item.id === reporte.tipoId);
      return {
        id: cambio.id,
        reporteId: cambio.reporteId,
        codigo: reporte.codigo,
        tipoNombre: tipo?.nombre ?? "Reporte",
        estado: cambio.estado,
        comentario: cambio.comentario,
        fechaHora: cambio.fechaHora,
      };
    });
};

export function validarBorradorReporte(borrador: DatosBorradorReporte) {
  if (!tiposReporteMock.some((tipo) => tipo.id === borrador.tipoId)) {
    throw new ErrorServicio({
      codigo: "TIPO_INVALIDO",
      mensaje: "Elegí el tipo de problema.",
    });
  }

  if (borrador.fotos.length < 1) {
    throw new ErrorServicio({
      codigo: "FOTO_OBLIGATORIA",
      mensaje: "El reporte necesita al menos una foto.",
    });
  }

  if (borrador.fotos.length > 2) {
    throw new ErrorServicio({
      codigo: "FOTOS_MAXIMAS",
      mensaje: "Podés adjuntar hasta dos fotos.",
    });
  }

  if (
    !Number.isFinite(borrador.latitud) ||
    !Number.isFinite(borrador.longitud)
  ) {
    throw new ErrorServicio({
      codigo: "UBICACION_INVALIDA",
      mensaje: "Marcá la ubicación en el mapa.",
    });
  }

  if (borrador.direccion.trim().length < 5) {
    throw new ErrorServicio({
      codigo: "DIRECCION_INVALIDA",
      mensaje: "No pudimos obtener la dirección. Mové el pin o usá tu ubicación.",
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
    audioUrl: borrador.audioUrl,
    fotos: borrador.fotos.map((url, indice) => ({
      id: `foto-local-${indice + 1}`,
      url,
      esPrincipal: indice === 0,
    })),
    coordenadas: {
      latitud: borrador.latitud,
      longitud: borrador.longitud,
    },
    direccion: borrador.direccion.trim(),
    zonaId: zonaParaCoordenadas({
      latitud: borrador.latitud,
      longitud: borrador.longitud,
    }),
    estado: "recibido",
    autorId,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    sincronizado: false,
  };
}

export function paramsDeTicket(reporte: Reporte) {
  const tipo = tiposReporteMock.find((item) => item.id === reporte.tipoId);
  return {
    codigo: reporte.codigo,
    tipoNombre: tipo?.nombre ?? "Reporte",
    area: tipo?.areaResponsable ?? "",
    direccion: reporte.direccion,
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

export const asignarCuadrilla = async (
  reporteId: string,
  cuadrillaId: string,
  operadorId: string,
): Promise<Reporte> => {
  await delay(500);

  const reporte = reportesMock.find((item) => item.id === reporteId);
  if (!reporte) {
    throw new ErrorServicio({
      codigo: "REPORTE_NO_ENCONTRADO",
      mensaje: "No encontramos ese reporte.",
    });
  }

  const cuadrilla = cuadrillasMock.find(
    (item) => item.id === cuadrillaId && item.activa,
  );
  if (!cuadrilla) {
    throw new ErrorServicio({
      codigo: "CUADRILLA_INVALIDA",
      mensaje: "Elegí una cuadrilla activa.",
    });
  }

  reporte.cuadrillaId = cuadrilla.id;
  reporte.estado = "asignado";

  cambiosEstadoMock.push({
    id: `cambio-${String(cambiosEstadoMock.length + 1).padStart(3, "0")}`,
    reporteId,
    estado: "asignado",
    comentario: `Asignado a ${cuadrilla.nombre}`,
    operadorId,
    fechaHora: new Date().toISOString(),
  });

  return reporte;
};
