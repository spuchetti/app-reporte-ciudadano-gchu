import { cambiosEstadoMock, reportesMock } from "@/mocks";
import {
  asignarCuadrilla,
  adherirAReporte,
  crearReporte,
  datosCreacionDesdeBorrador,
  obtenerAvisosDeEstado,
  obtenerReportesPorZona,
  paramsDeTicket,
  resumenReportesCerca,
  ultimosReportesPublicos,
  validarBorradorReporte,
} from "@/servicios/reportes";
import { zonaParaCoordenadas } from "@/servicios/ubicacion";
import { DatosBorradorReporte } from "@/tipos";

const reportesIniciales = reportesMock.length;

const borradorValido: DatosBorradorReporte = {
  tipoId: "tip-bache",
  descripcion: "Pozo en la esquina",
  direccion: "Rocamora 1240",
  latitud: -33.0123,
  longitud: -58.5123,
  fotos: ["file://foto-bache.jpg"],
  audioUrl: null,
};

async function esperar<T>(promesa: Promise<T>): Promise<T> {
  const pendiente = promesa;
  await jest.runAllTimersAsync();
  return pendiente;
}

describe("servicios/reportes", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    reportesMock.splice(reportesIniciales);
    jest.useRealTimers();
  });

  test("exige un tipo de problema", () => {
    try {
      validarBorradorReporte({ ...borradorValido, tipoId: "" });
      throw new Error("debía rechazar el tipo");
    } catch (error) {
      expect(error).toMatchObject({ codigo: "TIPO_INVALIDO" });
    }
  });

  test("exige al menos una foto", () => {
    try {
      validarBorradorReporte({ ...borradorValido, fotos: [] });
      throw new Error("debía rechazar sin foto");
    } catch (error) {
      expect(error).toMatchObject({ codigo: "FOTO_OBLIGATORIA" });
    }
  });

  test("exige una dirección", () => {
    try {
      validarBorradorReporte({ ...borradorValido, direccion: "  " });
      throw new Error("debía rechazar la dirección");
    } catch (error) {
      expect(error).toMatchObject({ codigo: "DIRECCION_INVALIDA" });
    }
  });

  test("arma el reporte con foto, coordenadas y estado recibido", () => {
    const datos = datosCreacionDesdeBorrador(
      { ...borradorValido, descripcion: "Pozo grande" },
      "usr-nuevo",
    );

    expect(datos.autorId).toBe("usr-nuevo");
    expect(datos.estado).toBe("recibido");
    expect(datos.tipoId).toBe("tip-bache");
    expect(datos.direccion).toBe("Rocamora 1240");
    expect(datos.descripcion).toBe("Pozo grande");
    expect(datos.fotos).toHaveLength(1);
    expect(datos.fotos[0]?.esPrincipal).toBe(true);
    expect(datos.coordenadas).toEqual({
      latitud: -33.0123,
      longitud: -58.5123,
    });
  });

  test("asigna la zona según el pin", () => {
    expect(
      zonaParaCoordenadas({ latitud: -33.0123, longitud: -58.5123 }),
    ).toBe("zon-norte");
  });

  test("obtenerReportesPorZona solo devuelve esa zona", async () => {
    const norte = await esperar(obtenerReportesPorZona("zon-norte"));
    const vacia = await esperar(obtenerReportesPorZona(""));

    expect(norte.length).toBeGreaterThan(0);
    expect(norte.every((item) => item.zonaId === "zon-norte")).toBe(true);
    expect(vacia).toEqual([]);
  });

  test("resume cuántos reportes hay cerca", () => {
    expect(resumenReportesCerca(0)).toBe("No hay reportes cerca tuyo");
    expect(resumenReportesCerca(1)).toBe("Hay 1 reporte cerca tuyo");
    expect(resumenReportesCerca(3)).toBe("Hay 3 reportes cerca tuyo");
  });

  test("ordena los últimos reportes públicos por fecha", () => {
    const ultimos = ultimosReportesPublicos(
      reportesMock.filter((item) => item.zonaId === "zon-norte"),
      1,
    );

    expect(ultimos).toHaveLength(1);
    expect(ultimos[0]?.id).toBe("rep-001");
  });

  test("obtenerAvisosDeEstado solo trae cambios municipales del vecino", async () => {
    const avisos = await esperar(obtenerAvisosDeEstado("usr-001"));

    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos.every((aviso) => ["rep-001", "rep-004"].includes(aviso.reporteId))).toBe(
      true,
    );
    expect(avisos.some((aviso) => aviso.estado === "resuelto")).toBe(true);
    expect(avisos.some((aviso) => aviso.id === "cambio-001")).toBe(false);
  });

  test("crea el reporte ligado al vecino después de identificarlo", async () => {
    const payload = datosCreacionDesdeBorrador(
      { ...borradorValido, tipoId: "tip-luminaria", descripcion: "" },
      "usr-ana",
    );

    const reporte = await esperar(crearReporte(payload));

    expect(reporte.autorId).toBe("usr-ana");
    expect(reporte.descripcion).toBeNull();
    expect(reporte.codigo).toMatch(/^GCHU-2026-/);
    expect(reportesMock.some((item) => item.id === reporte.id)).toBe(true);
    expect(paramsDeTicket(reporte)).toMatchObject({
      codigo: reporte.codigo,
      tipoNombre: "Luminaria",
      direccion: "Rocamora 1240",
    });
  });

  test("asigna una cuadrilla activa y deja el reporte asignado", async () => {
    const original = reportesMock.find((item) => item.id === "rep-001");
    if (!original) {
      throw new Error("faltaba el reporte de prueba");
    }
    const estadoPrev = original.estado;
    const cuadrillaPrev = original.cuadrillaId;
    const cambiosPrev = cambiosEstadoMock.length;

    const actualizado = await esperar(
      asignarCuadrilla("rep-001", "cua-02", "usr-100"),
    );

    expect(actualizado.estado).toBe("asignado");
    expect(actualizado.cuadrillaId).toBe("cua-02");

    original.estado = estadoPrev;
    original.cuadrillaId = cuadrillaPrev;
    cambiosEstadoMock.splice(cambiosPrev);
  });

  test("permite sumarse a un reporte ajeno y no duplica la adhesión", async () => {
    const original = reportesMock.find((item) => item.id === "rep-001");
    if (!original) {
      throw new Error("faltaba el reporte de prueba");
    }
    const adhesionesPrev = original.adhesiones;

    const primera = await esperar(adherirAReporte("rep-001", "usr-002"));
    const segunda = await esperar(adherirAReporte("rep-001", "usr-002"));

    expect(primera.adhesiones).toBe(adhesionesPrev + 1);
    expect(segunda.adhesiones).toBe(adhesionesPrev + 1);

    original.adhesiones = adhesionesPrev;
  });

  test("rechaza sumarse al propio reporte", async () => {
    await expect(adherirAReporte("rep-001", "usr-001")).rejects.toMatchObject({
      codigo: "REPORTE_PROPIO",
    });
  });
});
