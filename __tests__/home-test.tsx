import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import HomeVecinoScreen from "../src/app/(tabs)/index";
import { obtenerReportesPorZona } from "@/servicios/reportes";

const mockPush = jest.fn();

jest.mock("@/global.css", () => "");

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    Marker: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    Callout: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("expo-image", () => {
  const { View } = require("react-native");
  return { Image: ({ children }: { children?: React.ReactNode }) => <View>{children}</View> };
});

jest.mock("@/contexto/sesion", () => ({
  useSesion: () => ({
    sesion: {
      esInvitado: false,
      usuario: { nombre: "Mirko", zonaId: "zon-norte", rol: "vecino", id: "usr-001" },
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
    }, [callback]);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => children,
}));

jest.mock("@/servicios/reportes", () => ({
  obtenerReportesPorZona: jest.fn(),
}));

const obtenerPorZona = obtenerReportesPorZona as jest.MockedFunction<
  typeof obtenerReportesPorZona
>;

const reporteNorte = {
  id: "rep-001",
  codigo: "GCHU-2026-00412",
  tipoId: "tip-bache",
  descripcion: "Pozo en Norte",
  audioUrl: null,
  fotos: [],
  coordenadas: { latitud: -33.01, longitud: -58.51 },
  direccion: "Rocamora 1240",
  zonaId: "zon-norte",
  estado: "recibido" as const,
  autorId: "usr-001",
  cuadrillaId: null,
  duplicadoDe: null,
  adhesiones: 0,
  creadoEn: "2026-09-01T10:00:00-03:00",
  sincronizado: true,
};

const reporteSur = {
  ...reporteNorte,
  id: "rep-003",
  descripcion: "Basura en Sur",
  zonaId: "zon-sur",
};

function arbolComoTexto(nodo: unknown): string {
  return JSON.stringify(nodo);
}

function buscarPorLabel(
  renderer: ReactTestRenderer,
  label: string,
) {
  return renderer.root.find(
    (nodo) => nodo.props.accessibilityLabel === label,
  );
}

describe("Home vecino", () => {
  beforeEach(() => {
    mockPush.mockClear();
    obtenerPorZona.mockReset();
    obtenerPorZona.mockResolvedValue([reporteNorte]);
  });

  test("renderiza la cabecera y el botón de cerrar sesión", async () => {
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<HomeVecinoScreen />);
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("Hola");
    expect(texto).toContain("Mirko");
    expect(texto).toContain("Cerrar sesión");
    expect(obtenerPorZona).toHaveBeenCalledWith("zon-norte");
  });

  test("pide los reportes de la zona del vecino y no mezcla otras zonas", async () => {
    obtenerPorZona.mockImplementation(async (zonaId: string) =>
      [reporteNorte, reporteSur].filter((item) => item.zonaId === zonaId),
    );

    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<HomeVecinoScreen />);
    });

    const texto = arbolComoTexto(tree!.toJSON());
    expect(texto).toContain("Pozo en Norte");
    expect(texto).not.toContain("Basura en Sur");
    expect(obtenerPorZona).toHaveBeenCalledWith("zon-norte");
  });

  test("el botón + abre el alta de reporte logueado", async () => {
    let tree: ReactTestRenderer;
    await act(async () => {
      tree = create(<HomeVecinoScreen />);
    });

    await act(async () => {
      buscarPorLabel(tree!, "Generar reporte").props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith("/reporte/nuevo");
  });
});
