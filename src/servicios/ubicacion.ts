import { Platform } from "react-native";
import * as Location from "expo-location";

import { zonasMock } from "@/mocks";
import { Coordenadas } from "@/tipos";

export const COORDENADAS_CENTRO = { latitud: -33.0156, longitud: -58.5089 };

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

export function zonaParaCoordenadas(coordenadas: Coordenadas): string {
  const zona = zonasMock.find((item) =>
    puntoEnPoligono(coordenadas, item.limite),
  );
  return zona?.id ?? "zon-centro";
}
