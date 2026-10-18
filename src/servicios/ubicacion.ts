import { Platform } from "react-native";
import * as Location from "expo-location";

import { zonasMock } from "@/mocks";
import { Coordenadas } from "@/tipos";

export const COORDENADAS_CENTRO = { latitud: -33.0156, longitud: -58.5089 };
export const ZONA_FUERA = "zon-fuera";
export const RADIO_ZONA_CERCANA_M = 500;

export function formatearDireccionGeo(
  direccion: Location.LocationGeocodedAddress,
): string {
  if (direccion.formattedAddress) {
    return direccion.formattedAddress;
  }

  const calle = [direccion.street, direccion.streetNumber]
    .filter(Boolean)
    .join(" ");
  return calle || direccion.name || direccion.district || "Gualeguaychú";
}

export async function obtenerUbicacionActual(): Promise<Coordenadas> {
  if (Platform.OS === "web") {
    return { ...COORDENADAS_CENTRO };
  }

  const permiso = await Location.requestForegroundPermissionsAsync();
  if (!permiso.granted) {
    throw new Error("Sin permiso de ubicación");
  }

  const posicion = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitud: posicion.coords.latitude,
    longitud: posicion.coords.longitude,
  };
}

export async function direccionDesdeCoordenadas(
  coordenadas: Coordenadas,
): Promise<string> {
  if (Platform.OS === "web") {
    return "Gualeguaychú";
  }

  const resultados = await Location.reverseGeocodeAsync({
    latitude: coordenadas.latitud,
    longitude: coordenadas.longitud,
  });
  const primero = resultados[0];
  if (!primero) {
    return "Gualeguaychú";
  }
  return formatearDireccionGeo(primero);
}

function puntoEnPoligono(punto: Coordenadas, limite: Coordenadas[]) {
  let dentro = false;
  for (let i = 0, j = limite.length - 1; i < limite.length; j = i, i += 1) {
    const xi = limite[i].longitud;
    const yi = limite[i].latitud;
    const xj = limite[j].longitud;
    const yj = limite[j].latitud;
    const cruza =
      yi > punto.latitud !== yj > punto.latitud &&
      punto.longitud < ((xj - xi) * (punto.latitud - yi)) / (yj - yi) + xi;
    if (cruza) {
      dentro = !dentro;
    }
  }
  return dentro;
}

const METROS_POR_GRADO = 111_320;

function metrosAlPoligono(punto: Coordenadas, limite: Coordenadas[]) {
  const cos = Math.cos((punto.latitud * Math.PI) / 180);
  let minimo = Infinity;

  for (let i = 0; i < limite.length; i += 1) {
    const a = limite[i];
    const b = limite[(i + 1) % limite.length];
    const ax = (a.longitud - punto.longitud) * METROS_POR_GRADO * cos;
    const ay = (a.latitud - punto.latitud) * METROS_POR_GRADO;
    const bx = (b.longitud - punto.longitud) * METROS_POR_GRADO * cos;
    const by = (b.latitud - punto.latitud) * METROS_POR_GRADO;
    const abx = bx - ax;
    const aby = by - ay;
    const largo = abx * abx + aby * aby;
    const avance =
      largo === 0 ? 0 : Math.max(0, Math.min(1, (-ax * abx - ay * aby) / largo));
    const distancia = Math.hypot(ax + avance * abx, ay + avance * aby);
    if (distancia < minimo) {
      minimo = distancia;
    }
  }

  return minimo;
}

export function zonaParaCoordenadas(coordenadas: Coordenadas): string {
  const dentro = zonasMock.find((item) =>
    puntoEnPoligono(coordenadas, item.limite),
  );
  if (dentro) {
    return dentro.id;
  }

  let cercana: { id: string; metros: number } | null = null;
  for (const zona of zonasMock) {
    const metros = metrosAlPoligono(coordenadas, zona.limite);
    if (!cercana || metros < cercana.metros) {
      cercana = { id: zona.id, metros };
    }
  }

  if (cercana && cercana.metros <= RADIO_ZONA_CERCANA_M) {
    return cercana.id;
  }
  return ZONA_FUERA;
}
