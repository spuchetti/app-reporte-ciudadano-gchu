import { esPendiente } from "@/servicios/bandeja";
import { Coordenadas, EstadoReporte, Reporte } from "@/tipos";

export const RADIO_DUPLICADO_M = 50;
export const RADIO_CERCA_M = 400;

export const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: "#F2B705",
  en_revision: "#2E6E9E",
  asignado: "#E8630C",
  resuelto: "#2F9E52",
  rechazado: "#D64545",
};

export const ESTADOS_MAPA: EstadoReporte[] = [
  "recibido",
  "en_revision",
  "asignado",
  "resuelto",
  "rechazado",
];

export type FiltroEstadoPublico = "nuevo" | "en_curso" | "resuelto" | "rechazado";

export const FILTROS_ESTADO_PUBLICO: {
  id: FiltroEstadoPublico;
  etiqueta: string;
}[] = [
  { id: "nuevo", etiqueta: "Nuevo" },
  { id: "en_curso", etiqueta: "En curso" },
  { id: "resuelto", etiqueta: "Resuelto" },
  { id: "rechazado", etiqueta: "No corresponde" },
];

export function etiquetaEstadoPublico(estado: EstadoReporte) {
  if (estado === "recibido") {
    return "Nuevo";
  }
  if (estado === "en_revision" || estado === "asignado") {
    return "En curso";
  }
  if (estado === "resuelto") {
    return "Resuelto";
  }
  return "No corresponde";
}

export function estadosDeFiltroPublico(
  filtro: FiltroEstadoPublico | null,
): EstadoReporte[] | null {
  if (!filtro) {
    return null;
  }
  if (filtro === "nuevo") {
    return ["recibido"];
  }
  if (filtro === "en_curso") {
    return ["en_revision", "asignado"];
  }
  if (filtro === "resuelto") {
    return ["resuelto"];
  }
  return ["rechazado"];
}

export type ReporteCercano = {
  reporte: Reporte;
  metros: number;
};

export function metrosEntre(a: Coordenadas, b: Coordenadas) {
  const radioTierra = 6_371_000;
  const phi1 = (a.latitud * Math.PI) / 180;
  const phi2 = (b.latitud * Math.PI) / 180;
  const dPhi = ((b.latitud - a.latitud) * Math.PI) / 180;
  const dLambda = ((b.longitud - a.longitud) * Math.PI) / 180;
  const seno =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * radioTierra * Math.atan2(Math.sqrt(seno), Math.sqrt(1 - seno));
}

export function reportesDentroDeRadio({
  reportes,
  origen,
  radioMetros,
  tipoId,
  soloAbiertos = false,
}: {
  reportes: Reporte[];
  origen: Coordenadas;
  radioMetros: number;
  tipoId?: string;
  soloAbiertos?: boolean;
}): ReporteCercano[] {
  return reportes
    .filter((reporte) => {
      if (tipoId && reporte.tipoId !== tipoId) {
        return false;
      }
      if (soloAbiertos && !esPendiente(reporte.estado)) {
        return false;
      }
      return metrosEntre(origen, reporte.coordenadas) <= radioMetros;
    })
    .map((reporte) => ({
      reporte,
      metros: Math.round(metrosEntre(origen, reporte.coordenadas)),
    }))
    .sort((a, b) => a.metros - b.metros);
}

export function filtrarReportesMapa({
  reportes,
  tipoId,
  estados,
  origen,
  soloCerca,
}: {
  reportes: Reporte[];
  tipoId: string | null;
  estados: EstadoReporte[] | null;
  origen: Coordenadas | null;
  soloCerca: boolean;
}): Reporte[] {
  return reportes.filter((reporte) => {
    if (tipoId && reporte.tipoId !== tipoId) {
      return false;
    }
    if (estados && !estados.includes(reporte.estado)) {
      return false;
    }
    if (soloCerca && origen) {
      return metrosEntre(origen, reporte.coordenadas) <= RADIO_CERCA_M;
    }
    return true;
  });
}
