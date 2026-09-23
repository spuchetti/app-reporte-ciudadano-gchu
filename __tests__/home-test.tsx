import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import HomeVecinoScreen from "../src/app/(tabs)/index";
import { obtenerAvisosDeEstado, obtenerReportesPorZona } from "@/servicios/reportes";

const mockPush = jest.fn();

jest.mock("@/global.css", () => "");

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

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
  // Una sola corrida al montar: si depende de `callback`, un re-render
  // puede re-disparar la carga y dejar a `act` colgado.
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

jest.mock("@/servicios/reportes", () => ({
  obtenerReportesPorZona: jest.fn(async () => []),
  obtenerAvisosDeEstado: jest.fn(async () => []),
  resumenReportesCerca: (cantidad: number) => {
    if (cantidad <= 0) {
      return "No hay reportes cerca tuyo";
    }
    if (cantidad === 1) {
      return "Hay 1 reporte cerca tuyo";
    }
    return `Hay ${cantidad} reportes cerca tuyo`;
  },
  ultimosReportesPublicos: (reportes: unknown[]) => reportes.slice(0, 3),
  etiquetaEstado: (estado: string) =>
    ({ en_revision: "en revisión" }[estado] ?? estado),
}));

const obtenerPorZona = obtenerReportesPorZona as jest.MockedFunction<
  typeof obtenerReportesPorZona
>;
const obtenerAvisos = obtenerAvisosDeEstado as jest.MockedFunction<
  typeof obtenerAvisosDeEstado
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
  fotoArreglo: null,
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

async function montarHome() {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(<HomeVecinoScreen />);
  });
  await act(async () => {
    await Promise.resolve();
  });
  return tree;
}

describe("Home vecino", () => {
  beforeEach(() => {
    mockPush.mockClear();
    obtenerPorZona.mockReset();
    obtenerAvisos.mockReset();
    obtenerPorZona.mockResolvedValue([reporteNorte]);
    obtenerAvisos.mockResolvedValue([]);
  });

  test("renderiza la cabecera y el botón de cerrar sesión", async () => {
    const tree = await montarHome();

    const texto = arbolComoTexto(tree.toJSON());
    expect(texto).toContain("Hola");
    expect(texto).toContain("Mirko");
    expect(texto).toContain("Cerrar sesión");
    expect(obtenerPorZona).toHaveBeenCalledWith("zon-norte");
  });

  test("pide los reportes de la zona del vecino y no mezcla otras zonas", async () => {
    obtenerPorZona.mockImplementation(async (zonaId: string) =>
      [reporteNorte, reporteSur].filter((item) => item.zonaId === zonaId),
    );

    const tree = await montarHome();

    const texto = arbolComoTexto(tree.toJSON());
    expect(texto).toContain("Pozo en Norte");
    expect(texto).not.toContain("Basura en Sur");
    expect(obtenerPorZona).toHaveBeenCalledWith("zon-norte");
  });

  test("muestra cuántos reportes hay cerca y los últimos de la zona", async () => {
    const tree = await montarHome();

    const texto = arbolComoTexto(tree.toJSON());
    expect(texto).toContain("Hay 1 reporte cerca tuyo");
    expect(texto).toContain("Últimos de tu zona");
  });

  test("muestra avisos de cambio de estado de sus reportes", async () => {
    obtenerAvisos.mockResolvedValue([
      {
        id: "cambio-008",
        reporteId: "rep-004",
        codigo: "GCHU-2026-00448",
        tipoNombre: "Rama / árbol",
        estado: "resuelto",
        comentario: "Rama retirada, vereda despejada",
        fechaHora: "2026-09-16T10:00:00-03:00",
      },
    ]);

    const tree = await montarHome();

    const texto = arbolComoTexto(tree.toJSON());
    expect(texto).toContain("Tu reporte de Rama / árbol está resuelto.");
    expect(obtenerAvisos).toHaveBeenCalledWith("usr-001");
  });

  test("el botón Reportar problema abre el alta de reporte", async () => {
    const tree = await montarHome();

    await act(async () => {
      buscarPorLabel(tree, "Reportar problema").props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith("/reporte/nuevo");
  });
});
