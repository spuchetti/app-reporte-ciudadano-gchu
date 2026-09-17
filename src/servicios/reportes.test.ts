import { reportesMock } from "@/mocks";
import {
  crearReporte,
  datosCreacionDesdeBorrador,
  validarBorradorReporte,
} from "@/servicios/reportes";

const reportesIniciales = reportesMock.length;

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
      validarBorradorReporte({
        tipoId: "",
        descripcion: "Pozo en la esquina",
        direccion: "Rocamora 1240",
      });
      throw new Error("debía rechazar el tipo");
    } catch (error) {
      expect(error).toMatchObject({ codigo: "TIPO_INVALIDO" });
    }
  });

  test("exige una dirección", () => {
    try {
      validarBorradorReporte({
        tipoId: "tip-bache",
        descripcion: "Pozo en la esquina",
        direccion: "  ",
      });
      throw new Error("debía rechazar la dirección");
    } catch (error) {
      expect(error).toMatchObject({ codigo: "DIRECCION_INVALIDA" });
    }
  });

  test("arma el reporte con el vecino como autor y estado recibido", () => {
    const datos = datosCreacionDesdeBorrador(
      {
        tipoId: "tip-bache",
        descripcion: "Pozo grande",
        direccion: "Rocamora 1240",
      },
      "usr-nuevo",
    );

    expect(datos.autorId).toBe("usr-nuevo");
    expect(datos.estado).toBe("recibido");
    expect(datos.tipoId).toBe("tip-bache");
    expect(datos.direccion).toBe("Rocamora 1240");
    expect(datos.descripcion).toBe("Pozo grande");
  });

  test("crea el reporte ligado al vecino después de identificarlo", async () => {
    const payload = datosCreacionDesdeBorrador(
      {
        tipoId: "tip-luminaria",
        descripcion: "",
        direccion: "25 de Mayo 890",
      },
      "usr-ana",
    );

    const reporte = await esperar(crearReporte(payload));

    expect(reporte.autorId).toBe("usr-ana");
    expect(reporte.descripcion).toBeNull();
    expect(reporte.codigo).toMatch(/^GCHU-2026-/);
    expect(reportesMock.some((item) => item.id === reporte.id)).toBe(true);
  });
});
