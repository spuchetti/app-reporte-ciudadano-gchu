import {
  cuadrillasMock,
  tiposReporteMock,
  usuariosMock,
  zonasMock,
} from "@/mocks";
import { Cuadrilla, EstadoReporte, Reporte } from "@/tipos";

export type PestanaBandeja = "todos" | "pendientes" | "mi_zona";

export const ESTADOS_BANDEJA: EstadoReporte[] = [
  "recibido",
  "en_revision",
  "asignado",
  "resuelto",
  "rechazado",
];

export function esPendiente(estado: EstadoReporte) {
  return estado !== "resuelto" && estado !== "rechazado";
}

export function puedeAsignar(estado: EstadoReporte) {
  return esPendiente(estado);
}

export const ESTADOS_GESTION: EstadoReporte[] = [
  "en_revision",
  "resuelto",
  "rechazado",
];

export function puedeGestionar(reporte: Pick<Reporte, "estado" | "duplicadoDe">) {
  return esPendiente(reporte.estado) && reporte.duplicadoDe === null;
}

export function reportesParaDuplicar(reportes: Reporte[], reporteId: string) {
  return reportes
    .filter((item) => item.id !== reporteId && item.duplicadoDe === null)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export function nombreZona(zonaId: string) {
  return zonasMock.find((zona) => zona.id === zonaId)?.nombre ?? "Zona";
}

export function nombreAutor(autorId: string) {
  return usuariosMock.find((usuario) => usuario.id === autorId)?.nombre ?? "Vecino";
}

export function nombreTipo(tipoId: string) {
  return tiposReporteMock.find((tipo) => tipo.id === tipoId)?.nombre ?? "Reporte";
}

export function iconoTipo(tipoId: string) {
  return tiposReporteMock.find((tipo) => tipo.id === tipoId)?.icono ?? "📌";
}

export function textoFotos(cantidad: number) {
  if (cantidad === 1) {
    return "1 foto";
  }
  return `${cantidad} fotos`;
}

export function haceTiempo(fechaIso: string, ahora = Date.now()) {
  const ms = Math.max(0, ahora - new Date(fechaIso).getTime());
  const minutos = Math.floor(ms / 60_000);
  if (minutos < 1) {
    return "ahora";
  }
  if (minutos < 60) {
    return minutos === 1 ? "hace 1 minuto" : `hace ${minutos} minutos`;
  }
  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    return horas === 1 ? "hace 1 hora" : `hace ${horas} horas`;
  }
  const dias = Math.floor(horas / 24);
  if (dias === 1) {
    return "hace 1 día";
  }
  return `hace ${dias} días`;
}

function coincideBusqueda(reporte: Reporte, busqueda: string) {
  const q = busqueda.trim().toLowerCase();
  if (!q) {
    return true;
  }

  const campos = [
    reporte.codigo,
    reporte.direccion,
    reporte.descripcion ?? "",
    nombreTipo(reporte.tipoId),
    nombreAutor(reporte.autorId),
    nombreZona(reporte.zonaId),
  ];

  return campos.some((campo) => campo.toLowerCase().includes(q));
}

export function filtrarReportesBandeja({
  reportes,
  pestana,
  zonaOperadorId,
  busqueda,
  zonaId,
  tipoId,
  estado,
}: {
  reportes: Reporte[];
  pestana: PestanaBandeja;
  zonaOperadorId: string | null;
  busqueda: string;
  zonaId: string | null;
  tipoId: string | null;
  estado: EstadoReporte | null;
}): Reporte[] {
  return reportes
    .filter((reporte) => {
      if (pestana === "pendientes" && !esPendiente(reporte.estado)) {
        return false;
      }
      if (pestana === "mi_zona") {
        if (!zonaOperadorId || reporte.zonaId !== zonaOperadorId) {
          return false;
        }
      }
      if (zonaId && reporte.zonaId !== zonaId) {
        return false;
      }
      if (tipoId && reporte.tipoId !== tipoId) {
        return false;
      }
      if (estado && reporte.estado !== estado) {
        return false;
      }
      return coincideBusqueda(reporte, busqueda);
    })
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export function nombreCuadrilla(cuadrillaId: string) {
  return (
    cuadrillasMock.find((cuadrilla) => cuadrilla.id === cuadrillaId)?.nombre ??
    "Cuadrilla"
  );
}

export function cuadrillasParaReporte(zonaId: string): Cuadrilla[] {
  return cuadrillasMock.filter(
    (cuadrilla) => cuadrilla.activa && cuadrilla.zonaId === zonaId,
  );
}

export function resumenFiltros({
  zonaId,
  tipoId,
  estado,
}: {
  zonaId: string | null;
  tipoId: string | null;
  estado: EstadoReporte | null;
}) {
  const partes = [
    zonaId ? nombreZona(zonaId) : null,
    tipoId ? nombreTipo(tipoId) : null,
    estado,
  ].filter(Boolean);
  return partes.join(" · ");
}
