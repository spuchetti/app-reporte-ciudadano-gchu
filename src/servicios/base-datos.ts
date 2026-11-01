import { type SQLiteDatabase } from "expo-sqlite";
import { BorradorEnCurso, Reporte } from "@/tipos";

export const NOMBRE_BASE_DATOS = "reporte_ciudadano.db";
const VERSION_ESQUEMA = 1;

let dbActiva: SQLiteDatabase | null = null;
const colaMemoriaRespaldo = new Map<string, Reporte>();

export function fijarBaseDeDatosActiva(db: SQLiteDatabase | null) {
  dbActiva = db;
}

export function obtenerBaseDeDatosActiva(): SQLiteDatabase | null {
  return dbActiva;
}

/**
 * Se ejecuta automáticamente al iniciar <SQLiteProvider onInit={migrarBaseDeDatos}>
 */
export async function migrarBaseDeDatos(db: SQLiteDatabase): Promise<void> {
  fijarBaseDeDatosActiva(db);

  const filaVersion = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const versionActual = filaVersion?.user_version ?? 0;

  if (versionActual < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS borradores_reporte (
        id TEXT PRIMARY KEY NOT NULL,
        tipoId TEXT NOT NULL DEFAULT '',
        descripcion TEXT NOT NULL DEFAULT '',
        direccion TEXT NOT NULL DEFAULT '',
        latitud REAL,
        longitud REAL,
        fotosJson TEXT NOT NULL DEFAULT '[]',
        audioUrl TEXT,
        paso INTEGER NOT NULL DEFAULT 1,
        pendienteEnvio INTEGER NOT NULL DEFAULT 0,
        adherirAId TEXT,
        actualizadoEn TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cola_reportes (
        id TEXT PRIMARY KEY NOT NULL,
        codigo TEXT NOT NULL,
        autorId TEXT NOT NULL,
        payloadJson TEXT NOT NULL,
        creadoEn TEXT NOT NULL
      );
    `);

    await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA}`);
  }
}

type FilaBorradorSQL = {
  id: string;
  tipoId: string;
  descripcion: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  fotosJson: string;
  audioUrl: string | null;
  paso: number;
  pendienteEnvio: number;
  adherirAId: string | null;
  actualizadoEn: string;
};

export async function guardarBorradorEnSQLite(
  borrador: BorradorEnCurso,
  db: SQLiteDatabase | null = dbActiva
): Promise<void> {
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO borradores_reporte (
      id, tipoId, descripcion, direccion, latitud, longitud, fotosJson, audioUrl, paso, pendienteEnvio, adherirAId, actualizadoEn
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "actual",
      borrador.tipoId,
      borrador.descripcion,
      borrador.direccion,
      borrador.latitud,
      borrador.longitud,
      JSON.stringify(borrador.fotos),
      borrador.audioUrl,
      borrador.paso,
      borrador.pendienteEnvio ? 1 : 0,
      borrador.adherirAId,
      new Date().toISOString(),
    ]
  );
}

export async function leerBorradorDesdeSQLite(
  db: SQLiteDatabase | null = dbActiva
): Promise<BorradorEnCurso | null> {
  if (!db) return null;

  const fila = await db.getFirstAsync<FilaBorradorSQL>(
    "SELECT * FROM borradores_reporte WHERE id = ?",
    ["actual"]
  );

  if (!fila) return null;

  let fotos: string[] = [];
  try {
    fotos = JSON.parse(fila.fotosJson);
  } catch {
    fotos = [];
  }

  return {
    tipoId: fila.tipoId,
    descripcion: fila.descripcion,
    direccion: fila.direccion,
    latitud: fila.latitud,
    longitud: fila.longitud,
    fotos,
    audioUrl: fila.audioUrl,
    paso: fila.paso,
    pendienteEnvio: fila.pendienteEnvio === 1,
    adherirAId: fila.adherirAId,
  };
}

export async function eliminarBorradorDeSQLite(
  db: SQLiteDatabase | null = dbActiva
): Promise<void> {
  if (!db) return;
  await db.runAsync("DELETE FROM borradores_reporte WHERE id = ?", ["actual"]);
}

type FilaColaReporteSQL = {
  id: string;
  codigo: string;
  autorId: string;
  payloadJson: string;
  creadoEn: string;
};

export async function guardarReportePendienteSQLite(
  reporte: Reporte,
  db: SQLiteDatabase | null = dbActiva
): Promise<void> {
  colaMemoriaRespaldo.set(reporte.id, reporte);
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO cola_reportes (id, codigo, autorId, payloadJson, creadoEn)
     VALUES (?, ?, ?, ?, ?)`,
    [
      reporte.id,
      reporte.codigo,
      reporte.autorId,
      JSON.stringify(reporte),
      reporte.creadoEn,
    ]
  );
}

export async function listarReportesPendientesSQLite(
  db: SQLiteDatabase | null = dbActiva
): Promise<Reporte[]> {
  if (!db) {
    return Array.from(colaMemoriaRespaldo.values());
  }

  const filas = await db.getAllAsync<FilaColaReporteSQL>(
    "SELECT * FROM cola_reportes ORDER BY creadoEn ASC"
  );

  const lista: Reporte[] = [];
  for (const fila of filas) {
    try {
      lista.push(JSON.parse(fila.payloadJson) as Reporte);
    } catch {
      // Ignorar fila corrupta
    }
  }
  return lista;
}

export async function eliminarReportePendienteSQLite(
  id: string,
  db: SQLiteDatabase | null = dbActiva
): Promise<void> {
  colaMemoriaRespaldo.delete(id);
  if (!db) return;
  await db.runAsync("DELETE FROM cola_reportes WHERE id = ?", [id]);
}