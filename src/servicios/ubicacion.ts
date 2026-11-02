import { Platform } from "react-native";
import * as Location from "expo-location";

import { zonasMock } from "@/mocks";
import { hayInternet } from "@/servicios/red";
import { Coordenadas } from "@/tipos";

export const COORDENADAS_CENTRO = { latitud: -33.0156, longitud: -58.5089 };
export const ZONA_FUERA = "zon-fuera";
export const RADIO_ZONA_CERCANA_M = 500;

/** Texto válido cuando no hay red para geocodear la calle. */
export const DIRECCION_SIN_CONEXION = "Ubicación marcada (sin conexión)";

const PATRON_COORDS = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

/** ¿El texto es un par lat,lon? No sirve como dirección en la UI. */
export function esDireccionCoordenadas(texto: string): boolean {
  return PATRON_COORDS.test(texto.trim());
}

/** ¿El texto es solo la ciudad (o ciudad + provincia) sin calle? */
export function esDireccionSoloCiudad(texto: string): boolean {
  const t = texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!t) {
    return true;
  }
  if (esDireccionCoordenadas(t)) {
    return true;
  }
  if (t === "gualeguaychu") {
    return true;
  }
  if (t.startsWith("gualeguaychu") && !/\d/.test(t)) {
    return true;
  }
  return false;
}

/** Dirección usable online (calle, no ciudad sola ni coords). */
export function esDireccionCalle(texto: string): boolean {
  const limpio = texto.trim();
  return (
    limpio.length >= 3 &&
    !esDireccionSoloCiudad(limpio) &&
    !esDireccionCoordenadas(limpio)
  );
}

/** Acepta calle real o el placeholder offline. */
export function esDireccionAceptable(texto: string): boolean {
  const limpio = texto.trim();
  if (limpio === DIRECCION_SIN_CONEXION) {
    return true;
  }
  return esDireccionCalle(limpio);
}

/**
 * Arma una dirección legible priorizando calle y altura.
 * En Android `formattedAddress` a menudo es solo la ciudad; por eso no se usa primero.
 */
export function formatearDireccionGeo(
  direccion: Location.LocationGeocodedAddress,
): string {
  const calle = [direccion.street, direccion.streetNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (esDireccionCalle(calle)) {
    return calle;
  }

  const nombre = (direccion.name ?? "").trim();
  if (
    nombre.length >= 3 &&
    !esDireccionSoloCiudad(nombre) &&
    nombre.toLowerCase() !== (direccion.city ?? "").trim().toLowerCase()
  ) {
    const conAltura = direccion.streetNumber
      ? `${nombre} ${direccion.streetNumber}`.trim()
      : nombre;
    if (esDireccionCalle(conAltura)) {
      return conAltura;
    }
  }

  const formateada = (direccion.formattedAddress ?? "").trim();
  if (formateada && !esDireccionSoloCiudad(formateada)) {
    const primera = formateada.split(",")[0]?.trim() ?? "";
    if (esDireccionCalle(primera)) {
      return primera;
    }
    if (esDireccionCalle(formateada)) {
      return formateada;
    }
  }

  const barrio = (direccion.district ?? direccion.subregion ?? "").trim();
  if (esDireccionCalle(barrio)) {
    return barrio;
  }

  return "";
}

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  path?: string;
  residential?: string;
  street?: string;
  house_number?: string;
};

type NominatimReverse = {
  display_name?: string;
  address?: NominatimAddress;
};

/** Respaldo OpenStreetMap cuando el geocode del sistema no trae calle. */
export async function direccionDesdeNominatim(
  coordenadas: Coordenadas,
): Promise<string> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${encodeURIComponent(String(coordenadas.latitud))}` +
    `&lon=${encodeURIComponent(String(coordenadas.longitud))}` +
    `&addressdetails=1&zoom=18`;

  const respuesta = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ReporteCiudadanoGCHU/1.0 (app educativa UNER)",
    },
  });
  if (!respuesta.ok) {
    return "";
  }

  const datos = (await respuesta.json()) as NominatimReverse;
  const address = datos.address ?? {};
  const calle =
    address.road ||
    address.pedestrian ||
    address.path ||
    address.residential ||
    address.street;
  if (calle) {
    const texto = address.house_number
      ? `${calle} ${address.house_number}`
      : calle;
    return esDireccionCalle(texto) ? texto : "";
  }

  const primera = (datos.display_name ?? "").split(",")[0]?.trim() ?? "";
  return esDireccionCalle(primera) ? primera : "";
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

/**
 * Resuelve una calle para las coordenadas. Nunca devuelve lat,lon ni solo la ciudad.
 * Online sin calle → "". Offline sin calle → DIRECCION_SIN_CONEXION.
 */
export async function direccionDesdeCoordenadas(
  coordenadas: Coordenadas,
): Promise<string> {
  const online = await hayInternet();

  if (Platform.OS !== "web") {
    try {
      const resultados = await Location.reverseGeocodeAsync({
        latitude: coordenadas.latitud,
        longitude: coordenadas.longitud,
      });

      for (const item of resultados) {
        const texto = formatearDireccionGeo(item);
        if (esDireccionCalle(texto)) {
          return texto;
        }
      }
    } catch {
      // Probamos Nominatim si hay red.
    }
  }

  if (online) {
    try {
      const nominatim = await direccionDesdeNominatim(coordenadas);
      if (esDireccionCalle(nominatim)) {
        return nominatim;
      }
    } catch {
      // Sin calle.
    }
    return "";
  }

  return DIRECCION_SIN_CONEXION;
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
