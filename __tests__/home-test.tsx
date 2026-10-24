import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import HomeVecinoScreen from "../src/app/(tabs)/index";
import { ProveedorOrigenReporte } from "@/contexto/origen-reporte";
import { obtenerReportes } from "@/servicios/reportes";

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
    PROVIDER_GOOGLE: "google",
  };
});

jest.mock("expo-image", () => {
  const { View } = require("react-native");
  return { Image: ({ children }: { children?: React.ReactNode }) => <View>{children}</View> };
});

jest.mock("@/contexto/sesion", () => {
  const sesion = {
    esInvitado: false,
    usuario: { nombre: "Mirko", zonaId: "zon-norte", rol: "vecino", id: "usr-001" },
  };
  return {
    useSesion: () => ({
      sesion,
      cerrarSesion: jest.fn(),
    }),
  };
});

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
  obtenerReportes: jest.fn(async () => []),
}));

jest.mock("@/servicios/ubicacion", () => ({
  obtenerUbicacionActual: jest.fn(async () => {
    throw new Error("sin gps");
  }),
  COORDENADAS_CENTRO: { latitud: -33.0156, longitud: -58.5089 },
}));

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

const obtenerLista = obtenerReportes as jest.MockedFunction<typeof obtenerReportes>;

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
    tree = create(
      <ProveedorOrigenReporte>
        <HomeVecinoScreen />
      </ProveedorOrigenReporte>,
    );
  });
  return tree;
}

describe("Home vecino", () => {
  jest.setTimeout(20000);
  beforeEach(() => {
    mockPush.mockClear();
    obtenerLista.mockReset();
    obtenerLista.mockResolvedValue([reporteNorte]);
  });

  test("renderiza el mapa y el acceso para cerrar sesión", async () => {
    const tree = await montarHome();

    const texto = arbolComoTexto(tree.toJSON());
    expect(texto).toContain("Gualeguaychú");
    expect(texto).toContain("Hola, Mirko");
    buscarPorLabel(tree, "Filtros");
    buscarPorLabel(tree, "Cerrar sesión");
    expect(obtenerLista).toHaveBeenCalled();
  });

  test("muestra los reportes que llegan al mapa", async () => {
    const tree = await montarHome();

    const texto = arbolComoTexto(tree.toJSON());
    expect(texto).toContain("Pozo en Norte");
    expect(texto).toContain("Mostramos los reportes de la ciudad");
  });
});
