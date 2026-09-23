import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

import BandejaOperadorScreen from "../src/app/(operador)/index";
import { obtenerReportes } from "@/servicios/reportes";
import { Reporte } from "@/tipos";

const mockPush = jest.fn();

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
    cerrarSesion: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const ReactLib = require("react");
    ReactLib.useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === "function" ? cleanup : undefined;
    }, []);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock("@/components/operador/sheet-asignar", () => ({
  SheetAsignar: () => null,
}));

jest.mock("@/servicios/reportes", () => ({
  obtenerReportes: jest.fn(async () => []),
  obtenerTiposReporte: jest.fn(async () => [
    { id: "tip-bache", nombre: "Bache", icono: "🚧", color: "#E8630C", areaResponsable: "Obras" },
  ]),
  asignarCuadrilla: jest.fn(),
  etiquetaEstado: (estado: string) =>
    ({ en_revision: "en revisión" }[estado] ?? estado),
  delay: () => Promise.resolve(),
}));

const obtenerLista = obtenerReportes as jest.MockedFunction<typeof obtenerReportes>;

const reporteNorte: Reporte = {
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

const reporteSur: Reporte = {
  ...reporteNorte,
  id: "rep-003",
  codigo: "GCHU-2026-00435",
  tipoId: "tip-basura",
  descripcion: "Basura en Sur",
  direccion: "San Martín 456",
  zonaId: "zon-sur",
  estado: "asignado",
  autorId: "usr-003",
};

const reporteResuelto: Reporte = {
  ...reporteNorte,
  id: "rep-004",
  codigo: "GCHU-2026-00448",
  tipoId: "tip-rama",
  descripcion: "Rama caída",
  direccion: "Belgrano 234",
  estado: "resuelto",
};

function arbolComoTexto(nodo: unknown): string {
  return JSON.stringify(nodo);
}

function buscarPorLabel(renderer: ReactTestRenderer, label: string) {
  return renderer.root.find((nodo) => nodo.props.accessibilityLabel === label);
}

describe("Bandeja operador", () => {
  beforeEach(() => {
    mockPush.mockClear();
    obtenerLista.mockReset();
    obtenerLista.mockResolvedValue([reporteNorte, reporteSur, reporteResuelto]);
  });

  test("muestra código, vecina, zona y fotos", async () => {
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<BandejaOperadorScreen />);
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("GCHU-2026-00412");
    expect(texto).toContain("Rocamora 1240");
    expect(texto).toContain("Zona Norte");
    expect(texto).toContain("Norma Pereyra");
    expect(texto).toContain("1 foto");
    expect(texto).toContain("Cerrar sesión");
  });

  test("el buscador deja solo el reporte que coincide", async () => {
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<BandejaOperadorScreen />);
    });

    await act(async () => {
      buscarPorLabel(tree!, "Buscar reporte").props.onChangeText("Rocamora");
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("GCHU-2026-00412");
    expect(texto).not.toContain("GCHU-2026-00435");
  });

  test("la pestaña Mi zona oculta reportes de otra zona", async () => {
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<BandejaOperadorScreen />);
    });

    await act(async () => {
      buscarPorLabel(tree!, "Mi zona").props.onPress();
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("GCHU-2026-00412");
    expect(texto).not.toContain("San Martín 456");
  });

  test("pendientes oculta los resueltos", async () => {
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<BandejaOperadorScreen />);
    });

    await act(async () => {
      buscarPorLabel(tree!, "Pendientes").props.onPress();
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("GCHU-2026-00412");
    expect(texto).not.toContain("GCHU-2026-00448");
  });

  test("Revisar abre el detalle del reporte", async () => {
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<BandejaOperadorScreen />);
    });

    await act(async () => {
      buscarPorLabel(tree!, "Revisar GCHU-2026-00412").props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith("/(operador)/reporte/rep-001");
  });
});
