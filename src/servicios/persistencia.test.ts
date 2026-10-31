import { type SQLiteDatabase } from "expo-sqlite";
import {
  borrarValorKV,
  guardarValorKV,
  leerValorKV,
} from "@/servicios/almacen-kv";
import {
  eliminarBorradorDeSQLite,
  eliminarReportePendienteSQLite,
  guardarBorradorEnSQLite,
  guardarReportePendienteSQLite,
  leerBorradorDesdeSQLite,
  listarReportesPendientesSQLite,
  migrarBaseDeDatos,
} from "@/servicios/base-datos";
import { BorradorEnCurso, Reporte } from "@/tipos";

function crearMockSQLiteDB() {
  let userVersion = 0;
  const borradores = new Map<string, Record<string, unknown>>();
  const colaReportes = new Map<string, Record<string, unknown>>();
  const sqlEjecutados: string[] = [];

  const db = {
    sqlEjecutados,
    execAsync: jest.fn(async (sql: string) => {
      sqlEjecutados.push(sql);
      const match = sql.match(/PRAGMA\s+user_version\s*=\s*(\d+)/i);
      if (match) {
        userVersion = Number(match[1]);
      }
    }),
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      sqlEjecutados.push(sql);
      if (sql.includes("INSERT OR REPLACE INTO borradores_reporte")) {
        borradores.set(String(params[0]), {
          id: params[0],
          tipoId: params[1],
          descripcion: params[2],
          direccion: params[3],
          latitud: params[4],
          longitud: params[5],
          fotosJson: params[6],
          audioUrl: params[7],
          paso: params[8],
          pendienteEnvio: params[9],
          adherirAId: params[10],
          actualizadoEn: params[11],
        });
      } else if (sql.includes("DELETE FROM borradores_reporte")) {
        borradores.delete(String(params[0]));
      } else if (sql.includes("INSERT OR REPLACE INTO cola_reportes")) {
        colaReportes.set(String(params[0]), {
          id: params[0],
          codigo: params[1],
          autorId: params[2],
          payloadJson: params[3],
          creadoEn: params[4],
        });
      } else if (sql.includes("DELETE FROM cola_reportes")) {
        colaReportes.delete(String(params[0]));
      }
      return { changes: 1, lastInsertRowId: 1 };
    }),
    getFirstAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      sqlEjecutados.push(sql);
      if (sql.includes("PRAGMA user_version")) {
        return { user_version: userVersion };
      }
      if (sql.includes("FROM borradores_reporte")) {
        return borradores.get(String(params[0])) ?? null;
      }
      return null;
    }),
    getAllAsync: jest.fn(async (sql: string) => {
      sqlEjecutados.push(sql);
      if (sql.includes("FROM cola_reportes")) {
        return Array.from(colaReportes.values());
      }
      return [];
    }),
  };

  return db as unknown as SQLiteDatabase & { sqlEjecutados: string[] };
}

describe("Persistencia de datos (expo-sqlite/kv-store y SQLite relacional)", () => {
  it("guarda, lee y borra preferencias no sensibles en kv-store", async () => {
    await guardarValorKV("preferencia_tema", "oscuro");
    expect(await leerValorKV("preferencia_tema")).toBe("oscuro");

    await borrarValorKV("preferencia_tema");
    expect(await leerValorKV("preferencia_tema")).toBeNull();
  });


  it("ejecuta migraciones CREATE TABLE y persiste borradores en SQLite", async () => {
    const db = crearMockSQLiteDB();
    await migrarBaseDeDatos(db);

    expect(
      db.sqlEjecutados.some((s) =>
        s.includes("CREATE TABLE IF NOT EXISTS borradores_reporte"),
      ),
    ).toBe(true);

    const borrador: BorradorEnCurso = {
      tipoId: "tip-bache",
      descripcion: "Pozo profundo en la esquina",
      direccion: "Urquiza 1200",
      latitud: -33.009,
      longitud: -58.517,
      fotos: ["file:///foto1.jpg"],
      audioUrl: null,
      paso: 3,
      pendienteEnvio: true,
      adherirAId: null,
    };

    await guardarBorradorEnSQLite(borrador, db);
    const recuperado = await leerBorradorDesdeSQLite(db);
    expect(recuperado).toEqual(borrador);

    await eliminarBorradorDeSQLite(db);
    expect(await leerBorradorDesdeSQLite(db)).toBeNull();
  });

  it("encola, lista y elimina reportes pendientes de sincronización en SQLite", async () => {
    const db = crearMockSQLiteDB();
    await migrarBaseDeDatos(db);

    const reportePendiente: Reporte = {
      id: "rep-local-1",
      codigo: "LOCAL-123456",
      tipoId: "tip-luminaria",
      descripcion: "Farola apagada",
      audioUrl: null,
      fotos: [{ id: "f1", url: "file:///f1.jpg", esPrincipal: true }],
      coordenadas: { latitud: -33.01, longitud: -58.52 },
      direccion: "25 de Mayo 450",
      zonaId: "zon-centro",
      estado: "recibido",
      autorId: "usr-001",
      cuadrillaId: null,
      duplicadoDe: null,
      fotoArreglo: null,
      adhesiones: 0,
      creadoEn: "2026-10-30T22:00:00.000Z",
      sincronizado: false,
    };

    await guardarReportePendienteSQLite(reportePendiente, db);
    const pendientes = await listarReportesPendientesSQLite(db);
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].codigo).toBe("LOCAL-123456");

    await eliminarReportePendienteSQLite("rep-local-1", db);
    expect(await listarReportesPendientesSQLite(db)).toHaveLength(0);
  });
});