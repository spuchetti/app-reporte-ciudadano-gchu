import { reportesMock } from "@/mocks";
import {
  cuadrillasParaReporte,
  esPendiente,
  filtrarReportesBandeja,
  haceTiempo,
  reportesParaDuplicar,
  textoFotos,
} from "@/servicios/bandeja";

const filtrosVacios = {
  busqueda: "",
  zonaId: null,
  tipoId: null,
  estado: null,
};

describe("servicios/bandeja", () => {
  test("no ofrece el mismo reporte ni un duplicado como original", () => {
    const conDuplicado = reportesMock.map((item) =>
      item.id === "rep-002" ? { ...item, duplicadoDe: "rep-001" } : item,
    );
    const lista = reportesParaDuplicar(conDuplicado, "rep-001");
    expect(lista.some((item) => item.id === "rep-001")).toBe(false);
    expect(lista.some((item) => item.id === "rep-002")).toBe(false);
  });

  test("distingue pendientes de cerrados", () => {
    expect(esPendiente("recibido")).toBe(true);
    expect(esPendiente("asignado")).toBe(true);
    expect(esPendiente("resuelto")).toBe(false);
    expect(esPendiente("rechazado")).toBe(false);
  });

  test("escribe el tiempo relativo en español", () => {
    const ahora = Date.parse("2026-09-18T12:00:00-03:00");
    expect(haceTiempo("2026-09-18T12:00:00-03:00", ahora)).toBe("ahora");
    expect(haceTiempo("2026-09-16T12:00:00-03:00", ahora)).toBe("hace 2 días");
  });

  test("pluraliza las fotos", () => {
    expect(textoFotos(1)).toBe("1 foto");
    expect(textoFotos(2)).toBe("2 fotos");
  });

  test("la pestaña pendientes oculta resueltos y rechazados", () => {
    const lista = filtrarReportesBandeja({
      reportes: reportesMock,
      pestana: "pendientes",
      zonaOperadorId: "zon-norte",
      ...filtrosVacios,
    });

    expect(lista.every((item) => esPendiente(item.estado))).toBe(true);
    expect(lista.some((item) => item.id === "rep-004")).toBe(false);
  });

  test("mi zona solo trae la zona del operador", () => {
    const lista = filtrarReportesBandeja({
      reportes: reportesMock,
      pestana: "mi_zona",
      zonaOperadorId: "zon-norte",
      ...filtrosVacios,
    });

    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((item) => item.zonaId === "zon-norte")).toBe(true);
  });

  test("busca por dirección, código o vecino", () => {
    const porCalle = filtrarReportesBandeja({
      reportes: reportesMock,
      pestana: "todos",
      zonaOperadorId: "zon-norte",
      ...filtrosVacios,
      busqueda: "Rocamora",
    });
    const porVecina = filtrarReportesBandeja({
      reportes: reportesMock,
      pestana: "todos",
      zonaOperadorId: "zon-norte",
      ...filtrosVacios,
      busqueda: "Norma",
    });

    expect(porCalle.map((item) => item.id)).toEqual(["rep-001"]);
    expect(porVecina.some((item) => item.id === "rep-001")).toBe(true);
  });

  test("filtra por zona, tipo y estado", () => {
    const lista = filtrarReportesBandeja({
      reportes: reportesMock,
      pestana: "todos",
      zonaOperadorId: "zon-norte",
      busqueda: "",
      zonaId: "zon-norte",
      tipoId: "tip-rama",
      estado: "resuelto",
    });

    expect(lista.map((item) => item.id)).toEqual(["rep-004"]);
  });

  test("solo ofrece cuadrillas activas de la zona del reporte", () => {
    const norte = cuadrillasParaReporte("zon-norte");
    const este = cuadrillasParaReporte("zon-este");
    const sur = cuadrillasParaReporte("zon-sur");

    expect(norte.map((item) => item.id)).toEqual(["cua-01", "cua-02"]);
    expect(este).toEqual([]);
    expect(sur.map((item) => item.id)).toEqual(["cua-03"]);
  });
});
