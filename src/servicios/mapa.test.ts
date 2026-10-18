import { reportesMock } from "@/mocks";
import {
  RADIO_DUPLICADO_M,
  etiquetaEstadoPublico,
  estadosDeFiltroPublico,
  filtrarReportesMapa,
  metrosEntre,
  reportesDentroDeRadio,
} from "@/servicios/mapa";

const origen = { latitud: -33.0123, longitud: -58.5123 };

describe("servicios/mapa", () => {
  test("la distancia entre el mismo punto es 0", () => {
    expect(metrosEntre(origen, origen)).toBe(0);
  });

  test("detecta reportes a menos de 50 metros", () => {
    const a30m = {
      ...origen,
      latitud: origen.latitud + 30 / 111_320,
    };
    const a80m = {
      ...origen,
      latitud: origen.latitud + 80 / 111_320,
    };

    expect(metrosEntre(origen, a30m)).toBeLessThan(RADIO_DUPLICADO_M);
    expect(metrosEntre(origen, a80m)).toBeGreaterThan(RADIO_DUPLICADO_M);
  });

  test("el aviso de duplicado usa el mismo tipo y reportes abiertos", () => {
    const duplicados = reportesDentroDeRadio({
      reportes: reportesMock,
      origen,
      radioMetros: RADIO_DUPLICADO_M,
      tipoId: "tip-bache",
      soloAbiertos: true,
    });

    expect(duplicados.some((item) => item.reporte.id === "rep-001")).toBe(true);
    expect(duplicados.every((item) => item.reporte.tipoId === "tip-bache")).toBe(
      true,
    );
  });

  test("un duplicado no cuenta como reclamo separado", () => {
    const original = reportesMock[0];
    const duplicado = {
      ...original,
      id: "rep-dup",
      codigo: "GCHU-DUP",
      estado: "rechazado" as const,
      duplicadoDe: original.id,
    };
    const lista = [...reportesMock, duplicado];

    const filtrados = filtrarReportesMapa({
      reportes: lista,
      tipoId: null,
      estados: ["rechazado"],
      origen: null,
      soloCerca: false,
    });
    const cerca = reportesDentroDeRadio({
      reportes: lista,
      origen: original.coordenadas,
      radioMetros: 10,
    });

    expect(filtrados.some((item) => item.id === "rep-dup")).toBe(false);
    expect(cerca.some((item) => item.reporte.id === "rep-dup")).toBe(false);
    expect(cerca.some((item) => item.reporte.id === original.id)).toBe(true);
  });

  test("filtra el mapa público por tipo y estado", () => {
    const filtrados = filtrarReportesMapa({
      reportes: reportesMock,
      tipoId: "tip-bache",
      estados: ["recibido"],
      origen: null,
      soloCerca: false,
    });

    expect(filtrados.every((item) => item.tipoId === "tip-bache")).toBe(true);
    expect(filtrados.every((item) => item.estado === "recibido")).toBe(true);
  });

  test("el filtro En curso agrupa revisión y asignado", () => {
    expect(estadosDeFiltroPublico("en_curso")).toEqual(["en_revision", "asignado"]);
    expect(etiquetaEstadoPublico("recibido")).toBe("Nuevo");
    expect(etiquetaEstadoPublico("asignado")).toBe("En curso");
  });
});
