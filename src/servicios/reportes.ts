import { cambiosEstadoMock, reportesMock, tiposReporteMock } from "@/mocks";
import { CambioDeEstado, Reporte, TipoDeReporte } from "@/tipos";

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
