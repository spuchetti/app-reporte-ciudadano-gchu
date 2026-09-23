import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

import DetalleOperadorScreen from "../src/app/(operador)/reporte/[id]";
import { obtenerReportePorId, obtenerReportes } from "@/servicios/reportes";
import { Reporte } from "@/tipos";

jest.mock("@/global.css", () => "");

jest.mock("@/contexto/sesion", () => ({
  useSesion: () => ({
    sesion: {
      esInvitado: false,
      usuario: {
        nombre: "Jorge Fernández",
        zonaId: "zon-norte",
        rol: "operador",
        id: "usr-100",
      },
    },
  }),
}));

jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ id: "rep-001" }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const ReactLib = require("react");
    ReactLib.useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === "function" ? cleanup : undefined;
    }, [callback]);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/components/operador/sheet-asignar", () => ({
  SheetAsignar: () => null,
}));

jest.mock("@/components/operador/sheet-estado", () => ({
  SheetEstado: () => null,
}));

jest.mock("@/components/operador/sheet-duplicado", () => ({
  SheetDuplicado: () => null,
}));

jest.mock("@/servicios/reportes", () => ({
  obtenerReportePorId: jest.fn(async () => null),
  obtenerCambiosEstado: jest.fn(async () => []),
  obtenerReportes: jest.fn(async () => []),
  asignarCuadrilla: jest.fn(),
  actualizarEstado: jest.fn(),
  marcarDuplicado: jest.fn(),
  etiquetaEstado: (estado: string) =>
    ({ en_revision: "en revisión" }[estado] ?? estado),
}));

const obtenerUno = obtenerReportePorId as jest.MockedFunction<typeof obtenerReportePorId>;
const obtenerLista = obtenerReportes as jest.MockedFunction<typeof obtenerReportes>;

const reporteAbierto: Reporte = {
  id: "rep-001",
  codigo: "GCHU-2026-00412",
  tipoId: "tip-bache",
  descripcion: "Pozo en Norte",
  audioUrl: null,
  fotos: [{ id: "foto-001", url: "https://ejemplo.test/foto.jpg", esPrincipal: true }],
  coordenadas: { latitud: -33.01, longitud: -58.51 },
  direccion: "Rocamora 1240",
  zonaId: "zon-norte",
  estado: "recibido",
  autorId: "usr-001",
  cuadrillaId: null,
  duplicadoDe: null,
  fotoArreglo: null,
  adhesiones: 0,
  creadoEn: "2026-09-16T12:00:00-03:00",
  sincronizado: true,
};

function arbolComoTexto(nodo: unknown): string {
  return JSON.stringify(nodo);
}

describe("Detalle operador", () => {
  beforeEach(() => {
    obtenerUno.mockReset();
    obtenerLista.mockReset();
    obtenerLista.mockResolvedValue([reporteAbierto]);
  });

  test("un reporte abierto ofrece cambiar estado, duplicado y asignar", async () => {
    obtenerUno.mockResolvedValue(reporteAbierto);
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<DetalleOperadorScreen />);
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("Cambiar estado");
    expect(texto).toContain("Marcar duplicado");
    expect(texto).toContain("Asignar");
  });

  test("un reporte resuelto muestra la foto del arreglo y no las acciones", async () => {
    obtenerUno.mockResolvedValue({
      ...reporteAbierto,
      estado: "resuelto",
      fotoArreglo: {
        id: "foto-arreglo-001",
        url: "https://ejemplo.test/arreglo.jpg",
        esPrincipal: true,
      },
    });
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<DetalleOperadorScreen />);
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("Foto del arreglo");
    expect(texto).not.toContain("Cambiar estado");
    expect(texto).not.toContain("Marcar duplicado");
  });
});
