import { cambiosEstadoMock, reportesMock } from "@/mocks";
import {
  actualizarEstado,
  asignarCuadrilla,
  adherirAReporte,
  crearReporte,
  datosCreacionDesdeBorrador,
  marcarDuplicado,
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

  test("rechaza una cuadrilla de otra zona", async () => {
    const original = reportesMock.find((item) => item.id === "rep-001");
    if (!original) {
      throw new Error("faltaba el reporte de prueba");
    }
    const estadoPrev = original.estado;
    const cuadrillaPrev = original.cuadrillaId;

    const rechazo = expect(
      asignarCuadrilla("rep-001", "cua-03", "usr-100"),
    ).rejects.toMatchObject({ codigo: "CUADRILLA_OTRA_ZONA" });
    await jest.runAllTimersAsync();
    await rechazo;

    expect(original.estado).toBe(estadoPrev);
    expect(original.cuadrillaId).toBe(cuadrillaPrev);
  });

  test("rechaza una cuadrilla inactiva", async () => {
    const original = reportesMock.find((item) => item.id === "rep-003");
    if (!original) {
      throw new Error("faltaba el reporte de prueba");
    }
    const estadoPrev = original.estado;
    const cuadrillaPrev = original.cuadrillaId;

    const rechazo = expect(
      asignarCuadrilla("rep-003", "cua-05", "usr-101"),
    ).rejects.toMatchObject({ codigo: "CUADRILLA_INVALIDA" });
    await jest.runAllTimersAsync();
    await rechazo;

    expect(original.estado).toBe(estadoPrev);
    expect(original.cuadrillaId).toBe(cuadrillaPrev);
  });

  test("cambia el estado y deja el motivo en el historial", async () => {
    const original = reportesMock.find((item) => item.id === "rep-001");
    if (!original) {
      throw new Error("faltaba el reporte de prueba");
    }
    const estadoPrev = original.estado;
    const cambiosPrev = cambiosEstadoMock.length;

    try {
      const actualizado = await esperar(
        actualizarEstado("rep-001", "en_revision", "Se deriva a Obras", "usr-100"),
      );
      expect(actualizado.estado).toBe("en_revision");
      expect(cambiosEstadoMock.at(-1)).toMatchObject({
        reporteId: "rep-001",
        estado: "en_revision",
        comentario: "Se deriva a Obras",
        operadorId: "usr-100",
      });
    } finally {
      original.estado = estadoPrev;
      cambiosEstadoMock.splice(cambiosPrev);
    }
  });

  test("exige la foto del arreglo para resolver", async () => {
    const original = reportesMock.find((item) => item.id === "rep-001");
    if (!original) {
      throw new Error("faltaba el reporte de prueba");
    }
    const estadoPrev = original.estado;
    const fotoPrev = original.fotoArreglo;
    const cambiosPrev = cambiosEstadoMock.length;

    const rechazo = expect(
      actualizarEstado("rep-001", "resuelto", "Bache tapado", "usr-100"),
    ).rejects.toMatchObject({ codigo: "FOTO_ARREGLO_OBLIGATORIA" });
    await jest.runAllTimersAsync();
    await rechazo;
    expect(original.estado).toBe(estadoPrev);

    try {
      const actualizado = await esperar(
        actualizarEstado(
          "rep-001",
          "resuelto",
          "Bache tapado",
          "usr-100",
          "file://arreglo.jpg",
        ),
      );
      expect(actualizado.estado).toBe("resuelto");
      expect(actualizado.fotoArreglo?.url).toBe("file://arreglo.jpg");
    } finally {
      original.estado = estadoPrev;
      original.fotoArreglo = fotoPrev;
      cambiosEstadoMock.splice(cambiosPrev);
    }
  });

  test("no cambia un reporte ya cerrado ni acepta un motivo vacío", async () => {
    const cerrado = expect(
      actualizarEstado("rep-004", "en_revision", "Reabrir", "usr-100"),
    ).rejects.toMatchObject({ codigo: "REPORTE_CERRADO" });
    await jest.runAllTimersAsync();
    await cerrado;

    const sinMotivo = expect(
      actualizarEstado("rep-001", "en_revision", "  ", "usr-100"),
    ).rejects.toMatchObject({ codigo: "MOTIVO_OBLIGATORIO" });
    await jest.runAllTimersAsync();
    await sinMotivo;
    expect(reportesMock.find((item) => item.id === "rep-001")?.estado).toBe("recibido");
  });

  test("marca un reporte como duplicado del original y lo cierra", async () => {
    const copia = reportesMock.find((item) => item.id === "rep-002");
    if (!copia) {
      throw new Error("faltaba el reporte de prueba");
    }
    const estadoPrev = copia.estado;
    const duplicadoPrev = copia.duplicadoDe;
    const cambiosPrev = cambiosEstadoMock.length;

    try {
      const actualizado = await esperar(
        marcarDuplicado("rep-002", "rep-001", "usr-100"),
      );
      expect(actualizado.duplicadoDe).toBe("rep-001");
      expect(actualizado.estado).toBe("rechazado");
      expect(cambiosEstadoMock.at(-1)?.comentario).toBe("Duplicado de GCHU-2026-00412");
    } finally {
      copia.estado = estadoPrev;
      copia.duplicadoDe = duplicadoPrev;
      cambiosEstadoMock.splice(cambiosPrev);
    }
  });

  test("rechaza duplicado de sí mismo o de otro duplicado", async () => {
    const propio = expect(
      marcarDuplicado("rep-001", "rep-001", "usr-100"),
    ).rejects.toMatchObject({ codigo: "DUPLICADO_PROPIO" });
    await jest.runAllTimersAsync();
    await propio;

    const copia = reportesMock.find((item) => item.id === "rep-002");
    const tercero = reportesMock.find((item) => item.id === "rep-003");
    if (!copia || !tercero) {
      throw new Error("faltaba el reporte de prueba");
    }
    const copiaEstado = copia.estado;
    const copiaDuplicado = copia.duplicadoDe;
    const cambiosPrev = cambiosEstadoMock.length;
    copia.duplicadoDe = "rep-001";

    try {
      const rechazo = expect(
        marcarDuplicado("rep-003", "rep-002", "usr-100"),
      ).rejects.toMatchObject({ codigo: "DUPLICADO_DE_DUPLICADO" });
      await jest.runAllTimersAsync();
      await rechazo;
      expect(tercero.duplicadoDe).toBeNull();
    } finally {
      copia.estado = copiaEstado;
      copia.duplicadoDe = copiaDuplicado;
      cambiosEstadoMock.splice(cambiosPrev);
    }
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
