import {
  adhesionesMock,
  cambiosEstadoMock,
  cuadrillasMock,
  reportesMock,
  tiposReporteMock,
  zonasMock,
} from "@/mocks";
import {
  enPrueba,
  pedirLista,
  pedirReporte,
  pedirReportes,
  subirArchivo,
} from "@/servicios/api";
import { guardarValorKV, leerValorKV } from "@/servicios/almacen-kv";
import {
  eliminarReportePendienteSQLite,
  guardarReportePendienteSQLite,
  listarReportesPendientesSQLite,
} from "@/servicios/base-datos";
import { ESTADOS_GESTION, esPendiente } from "@/servicios/bandeja";
import { ErrorServicio, esErrorServicio } from "@/servicios/error";
import { hayInternet } from "@/servicios/red";
import {
  DIRECCION_SIN_CONEXION,
  direccionDesdeCoordenadas,
  esDireccionCalle,
  estaEnLaCiudad,
  MENSAJE_FUERA_DE_LA_CIUDAD,
  ZONA_FUERA,
  zonaParaCoordenadas,
} from "@/servicios/ubicacion";
import {
  Adhesion,
  CambioDeEstado,
  DatosBorradorReporte,
  EstadoReporte,
  Reporte,
  TipoDeReporte,
} from "@/tipos";

export { COORDENADAS_CENTRO } from "@/servicios/ubicacion";
export const ZONA_POR_DEFECTO = "zon-centro";

const CLAVE_CACHE_TIPOS = "cache:tipos-de-reporte";
const CLAVE_CACHE_MIS_REPORTES = "cache:mis-reportes:";
const CLAVE_CACHE_ADHESIONES = "cache:adhesiones:";

type ListenerCola = () => void;
const listenersCola = new Set<ListenerCola>();

type ListenerSyncUi = (activo: boolean) => void;
const listenersSyncUi = new Set<ListenerSyncUi>();

/** La UI (p. ej. Mis reportes) se suscribe para refrescar sin pull manual. */
export function alActualizarColaReportes(listener: ListenerCola) {
  listenersCola.add(listener);
  return () => {
    listenersCola.delete(listener);
  };
}

export function avisarColaReportesActualizada() {
  for (const listener of listenersCola) {
    listener();
  }
}

/** Indicador de recarga al sincronizar por recuperación de red. */
export function alEstadoSincronizacionRed(listener: ListenerSyncUi) {
  listenersSyncUi.add(listener);
  return () => {
    listenersSyncUi.delete(listener);
  };
}

export function avisarEstadoSincronizacionRed(activo: boolean) {
  for (const listener of listenersSyncUi) {
    listener(activo);
  }
}

async function guardarListaCache(clave: string, lista: Reporte[]) {
  try {
    await guardarValorKV(clave, JSON.stringify(lista));
  } catch {
    // Caché best-effort.
  }
}

async function leerListaCache(clave: string): Promise<Reporte[]> {
  const crudo = await leerValorKV(clave);
  if (!crudo) {
    return [];
  }
  try {
    const lista = JSON.parse(crudo) as Reporte[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function mezclarPropiosYCola(remotos: Reporte[], pendientes: Reporte[]) {
  const idsCola = new Set(pendientes.map((item) => item.id));
  const sinDuplicar = remotos.filter((item) => !idsCola.has(item.id));
  return [...pendientes, ...sinDuplicar].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
  );
}

function nuevoIdClienteReporte() {
  const alfabeto = "abcdefghijklmnopqrstuvwxyz0123456789";
  let sufijo = "";
  for (let i = 0; i < 12; i += 1) {
    sufijo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return `rep-${sufijo}`;
}

async function encolarReporteOffline(
  reporte: Omit<Reporte, "id" | "codigo" | "creadoEn">,
): Promise<Reporte> {
  const offline: Reporte = {
    ...reporte,
    id: nuevoIdClienteReporte(),
    codigo: codigoProvisorio(),
    creadoEn: new Date().toISOString(),
    sincronizado: false,
  };
  await guardarReportePendienteSQLite(offline);
  return offline;
}

const ETIQUETA_ESTADO: Record<EstadoReporte, string> = {
  recibido: "Recibido",
  en_revision: "En revisión",
  asignado: "Asignado",
  resuelto: "Resuelto",
  rechazado: "Rechazado",
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

export const ETIQUETA_PENDIENTE_SYNC = "Sin enviar";

export function etiquetaParaVecino(
  reporte: Pick<Reporte, "estado" | "sincronizado">,
) {
  if (!reporte.sincronizado) {
    return ETIQUETA_PENDIENTE_SYNC;
  }
  return etiquetaEstado(reporte.estado);
}

function codigoProvisorio() {
  const usados = new Set(reportesMock.map((reporte) => reporte.codigo));
  let codigo = "";
  do {
    codigo = `LOCAL-${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .toUpperCase()
      .padStart(6, "0")}`;
  } while (usados.has(codigo));
  return codigo;
}

function codigoDefinitivo() {
  const usados = new Set(reportesMock.map((reporte) => reporte.codigo));
  let secuencia = reportesMock.filter((reporte) => reporte.sincronizado).length + 1;
  let codigo = "";
  do {
    codigo = `GCHU-2026-${String(secuencia).padStart(5, "0")}`;
    secuencia += 1;
  } while (usados.has(codigo));
  return codigo;
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
export const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Obtener todos los reportes
const RUTA_MAPA =
  "/reportes?porPagina=500&estado=recibido,en_revision,asignado,resuelto,rechazado";

export const obtenerReportes = async (): Promise<Reporte[]> => {
  if (!enPrueba()) {
    return pedirReportes(RUTA_MAPA);
  }

  await delay(600);
  return reportesMock.filter((reporte) => reporte.sincronizado);
};

// Obtener un reporte por ID
export const obtenerReportePorId = async (
  id: string,
): Promise<Reporte | null> => {
  if (!enPrueba()) {
    const pendientes = await listarReportesPendientesSQLite();
    const local = pendientes.find(
      (item) => item.id === id || item.codigo === id,
    );
    if (local) {
      return { ...local, sincronizado: false };
    }

    const ruta = /^GCHU-/i.test(id)
      ? `/reportes/codigo/${encodeURIComponent(id)}`
      : `/reportes/${encodeURIComponent(id)}`;
    try {
      return await pedirReporte(ruta);
    } catch (error) {
      if (esErrorServicio(error) && error.codigo === "REPORTE_NO_ENCONTRADO") {
        return null;
      }
      throw error;
    }
  }

  await delay(400);
  const reporte = reportesMock.find((r) => r.id === id || r.codigo === id);
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
  return reportesMock.filter((r) => r.zonaId === zonaId && r.sincronizado);
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

  if (
    !estaEnLaCiudad({
      latitud: borrador.latitud,
      longitud: borrador.longitud,
    })
  ) {
    throw new ErrorServicio({
      codigo: "FUERA_DE_LA_CIUDAD",
      mensaje: MENSAJE_FUERA_DE_LA_CIUDAD,
    });
  }

  // Validación liviana acá: la UI exige calle (no ciudad sola ni coordenadas).
  if (borrador.direccion.trim().length < 3) {
    throw new ErrorServicio({
      codigo: "DIRECCION_INVALIDA",
      mensaje: "No pudimos obtener la calle. Mové el pin o tocá el mapa.",
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
    fotoArreglo: null,
    adhesiones: 0,
    sincronizado: false,
  };
}

export function paramsDeTicket(reporte: Reporte) {
  const tipo = tiposReporteMock.find((item) => item.id === reporte.tipoId);
  return {
    codigo: reporte.codigo,
    tipoNombre: tipo?.nombre ?? "Reporte",
    tipoId: reporte.tipoId,
    area: tipo?.areaResponsable ?? "",
    direccion: reporte.direccion,
    estado: etiquetaParaVecino(reporte),
    estadoClave: reporte.estado,
    pendiente: reporte.sincronizado ? "0" : "1",
  };
}

// Crear un nuevo reporte
export const crearReporte = async (
  reporte: Omit<Reporte, "id" | "codigo" | "creadoEn">,
): Promise<Reporte> => {
  if (!enPrueba()) {
    if (!(await hayInternet())) {
      return encolarReporteOffline(reporte);
    }

    try {
      const fotos = [];
      for (const foto of reporte.fotos) {
        const url = /^https?:\/\//.test(foto.url)
          ? foto.url
          : await subirArchivo(foto.url);
        fotos.push({ url });
      }

      let audioUrl: string | null = reporte.audioUrl;
      if (audioUrl && !/^https?:\/\//.test(audioUrl)) {
        audioUrl = await subirArchivo(audioUrl);
      }

      const creado = await pedirReporte("/reportes", {
        method: "POST",
        body: JSON.stringify({
          tipoId: reporte.tipoId,
          descripcion: reporte.descripcion,
          audioUrl: audioUrl || null,
          fotos,
          coordenadas: reporte.coordenadas,
          direccion: reporte.direccion,
          creadoEn: new Date().toISOString(),
        }),
      });
      // Envío online confirmado por la API: no es cola offline.
      return { ...creado, sincronizado: true };
    } catch (error) {
      if (esErrorServicio(error) && error.codigo === "RED") {
        return encolarReporteOffline(reporte);
      }
      throw error;
    }
  }

  await delay(800);

  const nuevoReporte: Reporte = {
    ...reporte,
    id: `rep-${String(reportesMock.length + 1).padStart(3, "0")}`,
    codigo: codigoProvisorio(),
    creadoEn: new Date().toISOString(),
    sincronizado: false,
  };

  // En un mock, agregamos al array (en la vida real, esto sería una API)
  reportesMock.push(nuevoReporte);
  await guardarReportePendienteSQLite(nuevoReporte);

  return nuevoReporte;
};

/** Tras identificar online, los reportes encolados con autor local pasan al id real. */
export async function remapeAutorPendientes(
  autorLocalId: string,
  autorRealId: string,
): Promise<void> {
  if (!autorLocalId || autorLocalId === autorRealId) {
    return;
  }
  const pendientes = await listarReportesPendientesSQLite();
  for (const pendiente of pendientes) {
    if (pendiente.autorId !== autorLocalId) {
      continue;
    }
    await guardarReportePendienteSQLite({
      ...pendiente,
      autorId: autorRealId,
    });
  }
}

/** Cualquier `usr-local-…` de este dispositivo queda asociado al vecino recién identificado. */
export async function remapeAutoresLocalesPendientes(
  autorRealId: string,
): Promise<void> {
  const pendientes = await listarReportesPendientesSQLite();
  for (const pendiente of pendientes) {
    if (!pendiente.autorId.startsWith("usr-local-")) {
      continue;
    }
    await guardarReportePendienteSQLite({
      ...pendiente,
      autorId: autorRealId,
    });
  }
}

export async function sincronizarPendientes(): Promise<Reporte[]> {
  if (!enPrueba()) {
    const pendientesSQL = await listarReportesPendientesSQLite();
    const sincronizados: Reporte[] = [];

    for (const pendiente of pendientesSQL) {
      // Esperan registro/ingreso real (sesión offline local).
      if (pendiente.autorId.startsWith("usr-local-")) {
        continue;
      }

      try {
        let direccion = pendiente.direccion.trim();
        if (
          !esDireccionCalle(direccion) ||
          direccion === DIRECCION_SIN_CONEXION
        ) {
          try {
            const resuelta = await direccionDesdeCoordenadas(
              pendiente.coordenadas,
            );
            if (esDireccionCalle(resuelta)) {
              direccion = resuelta;
              await guardarReportePendienteSQLite({
                ...pendiente,
                direccion,
              });
            }
          } catch {
            // Seguimos con lo guardado; se reintenta en el próximo sync.
          }
        }

        const fotos = [];
        for (const foto of pendiente.fotos) {
          const url = /^https?:\/\//.test(foto.url)
            ? foto.url
            : await subirArchivo(foto.url);
          fotos.push({ url });
        }

        let audioUrl: string | null = pendiente.audioUrl;
        if (audioUrl && !/^https?:\/\//.test(audioUrl)) {
          audioUrl = await subirArchivo(audioUrl);
        }

        const cuerpo: Record<string, unknown> = {
          tipoId: pendiente.tipoId,
          descripcion: pendiente.descripcion,
          audioUrl: audioUrl || null,
          fotos,
          coordenadas: pendiente.coordenadas,
          direccion,
          creadoEn: pendiente.creadoEn,
        };
        // Idempotencia: el id `rep-…` generado offline evita duplicar al reintentar.
        if (/^rep-[a-z0-9_-]{3,36}$/i.test(pendiente.id)) {
          cuerpo.id = pendiente.id;
        }

        const subido = await pedirReporte("/reportes", {
          method: "POST",
          body: JSON.stringify(cuerpo),
        });

        await eliminarReportePendienteSQLite(pendiente.id);
        sincronizados.push({ ...subido, sincronizado: true });
      } catch {
        // Si sigue sin red o falla uno, permanece en la tabla cola_reportes para el próximo intento
      }
    }

    if (sincronizados.length > 0) {
      avisarColaReportesActualizada();
    }
    return sincronizados;
  }

  await delay(500);

  const pendientes = reportesMock.filter((reporte) => !reporte.sincronizado);
  for (const reporte of pendientes) {
    reporte.codigo = codigoDefinitivo();
    reporte.sincronizado = true;
    await eliminarReportePendienteSQLite(reporte.id);
  }

  return pendientes;
}

function aplicarTiposEnMemoria(tipos: TipoDeReporte[]) {
  tiposReporteMock.splice(0, tiposReporteMock.length, ...tipos);
  return [...tipos];
}

async function tiposDesdeCache(): Promise<TipoDeReporte[] | null> {
  const crudo = await leerValorKV(CLAVE_CACHE_TIPOS);
  if (!crudo) {
    return null;
  }
  try {
    const tipos = JSON.parse(crudo) as TipoDeReporte[];
    if (!Array.isArray(tipos) || tipos.length === 0) {
      return null;
    }
    return aplicarTiposEnMemoria(tipos);
  } catch {
    return null;
  }
}

/** Precarga / refresca tipos cuando hay red (arranque o sync). */
export async function precargarTiposReporte(): Promise<void> {
  if (enPrueba() || !(await hayInternet())) {
    return;
  }
  try {
    await obtenerTiposReporte();
  } catch {
    // Si falla, queda la caché previa.
  }
}

// Obtener tipos de reporte (API → caché KV → mocks embebidos)
export const obtenerTiposReporte = async (): Promise<TipoDeReporte[]> => {
  if (!enPrueba()) {
    try {
      const tipos = await pedirLista<TipoDeReporte>("/tipos-de-reporte");
      if (tipos.length > 0) {
        await guardarValorKV(CLAVE_CACHE_TIPOS, JSON.stringify(tipos));
        return aplicarTiposEnMemoria(tipos);
      }
    } catch {
      // Offline o API caída: caché / mocks.
    }

    const cache = await tiposDesdeCache();
    if (cache) {
      return cache;
    }
    if (tiposReporteMock.length > 0) {
      return [...tiposReporteMock];
    }
    throw new ErrorServicio({
      codigo: "TIPOS_NO_DISPONIBLES",
      mensaje:
        "No hay tipos de reporte en el teléfono. Conectate una vez para sincronizarlos.",
    });
  }

  await delay(300);
  return [...tiposReporteMock];
};

// Obtener cambios de estado de un reporte
export const obtenerCambiosEstado = async (
  reporteId: string,
): Promise<CambioDeEstado[]> => {
  if (!enPrueba()) {
    return pedirLista<CambioDeEstado>(
      `/reportes/${encodeURIComponent(reporteId)}/cambios?porPagina=100`,
    );
  }

  await delay(400);
  return cambiosEstadoMock.filter((c) => c.reporteId === reporteId);
};

function registrarCambio(
  reporteId: string,
  estado: EstadoReporte,
  comentario: string,
  operadorId: string,
) {
  const cambio: CambioDeEstado = {
    id: `cambio-${String(cambiosEstadoMock.length + 1).padStart(3, "0")}`,
    reporteId,
    estado,
    comentario,
    operadorId,
    fechaHora: new Date().toISOString(),
  };
  cambiosEstadoMock.push(cambio);
  return cambio;
}

function reporteAbierto(reporteId: string) {
  const reporte = reportesMock.find((item) => item.id === reporteId);
  if (!reporte) {
    throw new ErrorServicio({
      codigo: "REPORTE_NO_ENCONTRADO",
      mensaje: "No encontramos ese reporte.",
    });
  }
  if (!esPendiente(reporte.estado) || reporte.duplicadoDe) {
    throw new ErrorServicio({
      codigo: "REPORTE_CERRADO",
      mensaje: "Este reporte ya está cerrado.",
    });
  }
  return reporte;
}

// Actualizar estado de un reporte
export const actualizarEstado = async (
  reporteId: string,
  nuevoEstado: Reporte["estado"],
  comentario: string,
  operadorId: string,
  fotoArregloUrl: string | null = null,
): Promise<Reporte> => {
  if (!enPrueba()) {
    if (nuevoEstado === "resuelto" && fotoArregloUrl) {
      const url = /^https?:\/\//.test(fotoArregloUrl)
        ? fotoArregloUrl
        : await subirArchivo(fotoArregloUrl);
      await pedirReporte(`/reportes/${encodeURIComponent(reporteId)}/fotos`, {
        method: "POST",
        body: JSON.stringify({ url }),
      });
    }

    return pedirReporte(`/reportes/${encodeURIComponent(reporteId)}/estado`, {
      method: "PATCH",
      body: JSON.stringify({
        estado: nuevoEstado,
        comentario: comentario.trim() || null,
      }),
    });
  }

  await delay(600);

  const reporte = reporteAbierto(reporteId);
  const motivo = comentario.trim();
  if (motivo.length < 3) {
    throw new ErrorServicio({
      codigo: "MOTIVO_OBLIGATORIO",
      mensaje: "Escribí por qué cambia el estado.",
    });
  }

  if (!ESTADOS_GESTION.includes(nuevoEstado) || nuevoEstado === reporte.estado) {
    throw new ErrorServicio({
      codigo: "ESTADO_INVALIDO",
      mensaje: "Elegí un estado distinto al actual.",
    });
  }

  if (nuevoEstado === "resuelto" && !fotoArregloUrl) {
    throw new ErrorServicio({
      codigo: "FOTO_ARREGLO_OBLIGATORIA",
      mensaje: "Subí la foto del arreglo para cerrar el reporte.",
    });
  }

  reporte.estado = nuevoEstado;
  if (nuevoEstado === "en_revision") {
    reporte.cuadrillaId = null;
  }
  if (nuevoEstado === "resuelto" && fotoArregloUrl) {
    reporte.fotoArreglo = {
      id: `foto-arreglo-${reporte.id}`,
      url: fotoArregloUrl,
      esPrincipal: true,
    };
  }

  registrarCambio(reporteId, nuevoEstado, motivo, operadorId);
  return reporte;
};

export function textoDuplicado(originalId: string) {
  return `Reclamo duplicado de este: ${originalId}`;
}

export const marcarDuplicado = async (
  reporteId: string,
  originalId: string,
  operadorId: string,
): Promise<Reporte> => {
  if (!enPrueba()) {
    return pedirReporte(`/reportes/${encodeURIComponent(reporteId)}/duplicado`, {
      method: "POST",
      body: JSON.stringify({ originalId }),
    });
  }

  await delay(500);

  if (reporteId === originalId) {
    throw new ErrorServicio({
      codigo: "DUPLICADO_PROPIO",
      mensaje: "Un reporte no puede ser duplicado de sí mismo.",
    });
  }

  const reporte = reporteAbierto(reporteId);
  const original = reportesMock.find((item) => item.id === originalId);
  if (!original) {
    throw new ErrorServicio({
      codigo: "REPORTE_NO_ENCONTRADO",
      mensaje: "No encontramos el reporte original.",
    });
  }
  if (original.duplicadoDe) {
    throw new ErrorServicio({
      codigo: "DUPLICADO_DE_DUPLICADO",
      mensaje: "Elegí el reporte original, no otro duplicado.",
    });
  }

  reporte.duplicadoDe = original.id;
  reporte.estado = "rechazado";
  sumarAdhesion(original, reporte.autorId);
  registrarCambio(
    reporteId,
    "rechazado",
    textoDuplicado(original.id),
    operadorId,
  );
  return reporte;
};

export function sePuedeCorregirZona() {
  return true;
}

export const corregirZona = async (
  reporteId: string,
  zonaId: string,
  operadorId: string,
): Promise<Reporte> => {
  if (!enPrueba()) {
    return pedirReporte(`/reportes/${encodeURIComponent(reporteId)}/zona`, {
      method: "PATCH",
      body: JSON.stringify({ zonaId }),
    });
  }

  await delay(400);

  const reporte = reportesMock.find((item) => item.id === reporteId);
  if (!reporte) {
    throw new ErrorServicio({
      codigo: "REPORTE_NO_ENCONTRADO",
      mensaje: "No encontramos ese reporte.",
    });
  }

  const zona = zonasMock.find((item) => item.id === zonaId);
  if (!zona) {
    throw new ErrorServicio({
      codigo: "ZONA_INVALIDA",
      mensaje: "Elegí una de las cuatro zonas.",
    });
  }

  reporte.zonaId = zona.id;
  if (reporte.cuadrillaId) {
    const cuadrilla = cuadrillasMock.find((item) => item.id === reporte.cuadrillaId);
    if (!cuadrilla || cuadrilla.zonaId !== zona.id) {
      reporte.cuadrillaId = null;
    }
  }

  registrarCambio(
    reporteId,
    reporte.estado,
    `Zona corregida a ${zona.nombre}`,
    operadorId,
  );
  return reporte;
};

export const asignarCuadrilla = async (
  reporteId: string,
  cuadrillaId: string,
  operadorId: string,
): Promise<Reporte> => {
  if (!enPrueba()) {
    const nombre = cuadrillasMock.find((item) => item.id === cuadrillaId)?.nombre;
    return pedirReporte(`/reportes/${encodeURIComponent(reporteId)}/cuadrilla`, {
      method: "PATCH",
      body: JSON.stringify({
        cuadrillaId,
        comentario: nombre ? `Asignado a ${nombre}` : null,
      }),
    });
  }

  await delay(500);

  const reporte = reportesMock.find((item) => item.id === reporteId);
  if (!reporte) {
    throw new ErrorServicio({
      codigo: "REPORTE_NO_ENCONTRADO",
      mensaje: "No encontramos ese reporte.",
    });
  }

  if (reporte.cuadrillaId || reporte.estado === "asignado") {
    throw new ErrorServicio({
      codigo: "YA_ASIGNADO",
      mensaje: "Este reporte ya tiene cuadrilla. No se puede reasignar.",
    });
  }

  if (reporte.estado !== "en_revision") {
    throw new ErrorServicio({
      codigo: "TRANSICION_INVALIDA",
      mensaje: "Ese cambio de estado no es posible desde el estado actual.",
    });
  }

  const cuadrilla = cuadrillasMock.find((item) => item.id === cuadrillaId);
  if (!cuadrilla || !cuadrilla.activa) {
    throw new ErrorServicio({
      codigo: "CUADRILLA_INVALIDA",
      mensaje: "Elegí una cuadrilla activa.",
    });
  }

  if (reporte.zonaId === ZONA_FUERA) {
    reporte.zonaId = cuadrilla.zonaId;
  } else if (cuadrilla.zonaId !== reporte.zonaId) {
    throw new ErrorServicio({
      codigo: "CUADRILLA_OTRA_ZONA",
      mensaje: "La cuadrilla no pertenece a la zona del reporte.",
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

export function adhesionesDelReporte(reporteId: string): Adhesion[] {
  return adhesionesMock.filter((item) => item.reporteId === reporteId);
}

function contarAdhesiones(reporteId: string) {
  return adhesionesDelReporte(reporteId).length;
}

function sumarAdhesion(reporte: Reporte, usuarioId: string) {
  adhesionesMock.push({
    id: `adh-${String(adhesionesMock.length + 1).padStart(3, "0")}`,
    reporteId: reporte.id,
    usuarioId,
    creadoEn: new Date().toISOString(),
  });
  reporte.adhesiones = contarAdhesiones(reporte.id);
}

export const adherirAReporte = async (
  reporteId: string,
  vecinoId: string,
): Promise<Reporte> => {
  if (!enPrueba()) {
    return pedirReporte(
      `/reportes/${encodeURIComponent(reporteId)}/adhesiones`,
      { method: "POST" },
    );
  }

  const reporte = reportesMock.find((item) => item.id === reporteId);
  if (!reporte) {
    throw new ErrorServicio({
      codigo: "REPORTE_NO_ENCONTRADO",
      mensaje: "No encontramos ese reporte.",
    });
  }

  if (reporte.autorId === vecinoId) {
    throw new ErrorServicio({
      codigo: "REPORTE_PROPIO",
      mensaje: "Ese reporte ya lo cargaste vos.",
    });
  }

  await delay(400);

  const yaSumado = adhesionesMock.some(
    (item) => item.reporteId === reporteId && item.usuarioId === vecinoId,
  );
  if (yaSumado) {
    reporte.adhesiones = contarAdhesiones(reporteId);
    return reporte;
  }

  sumarAdhesion(reporte, vecinoId);
  return reporte;
};

export async function obtenerReportesAdheridos(
  usuarioId: string,
): Promise<Reporte[]> {
  if (!enPrueba()) {
    const clave = `${CLAVE_CACHE_ADHESIONES}${usuarioId}`;
    try {
      const remotos = await pedirReportes("/yo/adhesiones?porPagina=100");
      await guardarListaCache(clave, remotos);
      return remotos;
    } catch {
      return leerListaCache(clave);
    }
  }

  await delay(400);
  const ids = new Set(
    adhesionesMock
      .filter((item) => item.usuarioId === usuarioId)
      .map((item) => item.reporteId),
  );
  return reportesMock
    .filter((reporte) => ids.has(reporte.id))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function obtenerMisReportes(usuarioId: string): Promise<Reporte[]> {
  if (!enPrueba()) {
    const clave = `${CLAVE_CACHE_MIS_REPORTES}${usuarioId}`;
    const pendientesLocal = await listarReportesPendientesSQLite();
    const propiosPendientes = pendientesLocal.filter(
      (rep) => rep.autorId === usuarioId,
    );

    try {
      const remotos = await pedirReportes("/yo/reportes?porPagina=100");
      const sincronizados = remotos.map((item) => ({
        ...item,
        sincronizado: true,
      }));
      await guardarListaCache(clave, sincronizados);
      return mezclarPropiosYCola(sincronizados, propiosPendientes);
    } catch {
      const cache = await leerListaCache(clave);
      return mezclarPropiosYCola(cache, propiosPendientes);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  return reportesMock
    .filter((rep) => rep.autorId === usuarioId)
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
}