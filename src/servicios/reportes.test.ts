import { reportesMock } from "@/mocks";
import {
  crearReporte,
  datosCreacionDesdeBorrador,
  paramsDeTicket,
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
});
