import { cuadrillasMock } from "@/mocks";
import {
  obtenerCuadrillas,
  obtenerCuadrillasPorZona,
  obtenerZonas,
  zonasConCuadrillas,
} from "@/servicios/zonas";
import { zonaParaCoordenadas } from "@/servicios/ubicacion";

async function esperar<T>(promesa: Promise<T>): Promise<T> {
  const pendiente = promesa;
  await jest.runAllTimersAsync();
  return pendiente;
}

describe("servicios/zonas", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("devuelve las cuatro zonas", async () => {
    const zonas = await esperar(obtenerZonas());

    expect(zonas.map((zona) => zona.id)).toEqual([
      "zon-norte",
      "zon-centro",
      "zon-sur",
      "zon-este",
    ]);
  });

  test("norte tiene dos cuadrillas", async () => {
    const cuadrillas = await esperar(obtenerCuadrillasPorZona("zon-norte"));

    expect(cuadrillas).toHaveLength(2);
    expect(cuadrillas.every((item) => item.zonaId === "zon-norte")).toBe(true);
  });

  test("sur incluye cua-05 inactiva", async () => {
    const cuadrillas = await esperar(obtenerCuadrillasPorZona("zon-sur"));
    const inactiva = cuadrillas.find((item) => item.id === "cua-05");

    expect(inactiva?.activa).toBe(false);
  });

  test("este no tiene cuadrillas", async () => {
    const cuadrillas = await esperar(obtenerCuadrillasPorZona("zon-este"));

    expect(cuadrillas).toEqual([]);
  });

  test("agrupa cada zona con sus cuadrillas", async () => {
    const grupos = await esperar(zonasConCuadrillas());
    const norte = grupos.find((item) => item.zona.id === "zon-norte");
    const este = grupos.find((item) => item.zona.id === "zon-este");

    expect(grupos).toHaveLength(4);
    expect(norte?.cuadrillas).toHaveLength(2);
    expect(este?.cuadrillas).toEqual([]);
  });

  test("copia las cuadrillas y no muta el mock", async () => {
    const primera = await esperar(obtenerCuadrillas());
    const original = cuadrillasMock.find((item) => item.id === primera[0]?.id);
    primera[0].activa = !primera[0].activa;

    const segunda = await esperar(obtenerCuadrillas());

    expect(segunda[0]?.activa).toBe(original?.activa);
  });

  test("asigna la zona según el pin y usa Centro si queda afuera", () => {
    expect(zonaParaCoordenadas({ latitud: -33.0123, longitud: -58.5123 })).toBe(
      "zon-norte",
    );
    expect(zonaParaCoordenadas({ latitud: -33.03, longitud: -58.51 })).toBe(
      "zon-centro",
    );
    expect(zonaParaCoordenadas({ latitud: -33.042, longitud: -58.51 })).toBe(
      "zon-sur",
    );
    expect(zonaParaCoordenadas({ latitud: -33.03, longitud: -58.48 })).toBe(
      "zon-este",
    );
    expect(zonaParaCoordenadas({ latitud: -32.9, longitud: -58.4 })).toBe(
      "zon-centro",
    );
  });
});
