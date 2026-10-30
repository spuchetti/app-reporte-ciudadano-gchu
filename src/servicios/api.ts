import axios, { isAxiosError } from "axios";
import { isDevice } from "expo-device";
import { Platform } from "react-native";

import { leerSecreto } from "@/servicios/almacen-seguro";
import { ErrorServicio } from "@/servicios/error";
import { Foto, Reporte } from "@/tipos";

function leerUrl(valor: string | undefined, respaldo: string) {
  const limpia = valor?.trim().replace(/\/$/, "");
  return limpia || respaldo;
}

const URL_PC = leerUrl(process.env.EXPO_PUBLIC_API_URL, "");
const URL_EMULADOR = leerUrl(process.env.EXPO_PUBLIC_API_URL_EMULADOR, "");
const URL_TELEFONO = leerUrl(process.env.EXPO_PUBLIC_API_URL_TELEFONO, "");

/** En la PC y en la web, localhost. En el emulador de Android, 10.0.2.2. En el teléfono, la IP de la PC. */
export function urlApi() {
  if (Platform.OS !== "android") {
    return URL_PC;
  }
  if (isDevice) {
    return URL_TELEFONO || URL_PC;
  }
  return URL_EMULADOR;
}

export const URL_API = urlApi();

const cliente = axios.create({ baseURL: URL_API });

const CLAVE_SESION = "sesion";

let tokenEnMemoria: string | null = null;

export function fijarTokenApi(token: string | null) {
  tokenEnMemoria = token;
}

/** Jest sigue usando los mocks. La app, en desarrollo, llama a la API. */
export function enPrueba() {
  return process.env.NODE_ENV === "test";
}

type ErrorCuerpo = { error?: { codigo?: string; mensaje?: string } };

type FotoApi = {
  id: string;
  url: string;
  momento?: "problema" | "arreglo";
  esPrincipal?: boolean;
};

type ReporteApi = Omit<Reporte, "fotos" | "fotoArreglo"> & {
  fotos: FotoApi[];
  fotoArreglo?: Foto | null;
};

function aFoto(foto: FotoApi, principal: boolean): Foto {
  return {
    id: foto.id,
    url: foto.url,
    esPrincipal: foto.esPrincipal ?? principal,
  };
}

/** La API manda fotos con `momento`. La app separa el problema y el arreglo. */
export function adaptarReporte(reporte: ReporteApi): Reporte {
  const arreglo = reporte.fotos.find((foto) => foto.momento === "arreglo");
  const problema = reporte.fotos.filter((foto) => foto.momento !== "arreglo");
  const fotos = (problema.length > 0 ? problema : reporte.fotos).map((foto, indice) =>
    aFoto(foto, indice === 0),
  );

  return {
    ...reporte,
    fotos,
    fotoArreglo: arreglo
      ? aFoto(arreglo, false)
      : (reporte.fotoArreglo ?? null),
  };
}

async function tokenGuardado(): Promise<string | null> {
  if (tokenEnMemoria) {
    return tokenEnMemoria;
  }

  const crudo = await leerSecreto(CLAVE_SESION);
  if (!crudo) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(crudo);
    if (
      parsed &&
      typeof parsed === "object" &&
      "token" in parsed &&
      typeof parsed.token === "string"
    ) {
      tokenEnMemoria = parsed.token;
      return parsed.token;
    }
  } catch {
    return null;
  }

  return null;
}

type OpcionesPedido = {
  method?: string;
  body?: BodyInit;
  token?: string | null;
  json?: boolean;
};

function errorDeCuerpo(cuerpo: unknown) {
  if (!cuerpo || typeof cuerpo !== "object" || !("error" in cuerpo)) {
    return undefined;
  }
  return (cuerpo as ErrorCuerpo).error;
}

export async function pedir<T>(ruta: string, opciones: OpcionesPedido = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = opciones.token === undefined ? await tokenGuardado() : opciones.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const esArchivo = opciones.json === false;
  if (!esArchivo && typeof opciones.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  try {
    const respuesta = await cliente.request<unknown>({
      url: ruta,
      method: opciones.method ?? "GET",
      headers,
      data: opciones.body,
      transformRequest: esArchivo ? [(data) => data] : undefined,
    });
    return datosDeCuerpo<T>(respuesta.data);
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const fallo = errorDeCuerpo(error.response.data);
      throw new ErrorServicio({
        codigo: fallo?.codigo ?? "ERROR_API",
        mensaje: fallo?.mensaje ?? "La API no pudo completar el pedido.",
      });
    }

    throw new ErrorServicio({
      codigo: "RED",
      mensaje: `No hay conexión con la API en ${URL_API}.`,
    });
  }
}

function datosDeCuerpo<T>(cuerpo: unknown): T {
  if (cuerpo && typeof cuerpo === "object" && "datos" in cuerpo) {
    return (cuerpo as { datos: T }).datos;
  }
  return cuerpo as T;
}

export async function pedirLista<T>(ruta: string): Promise<T[]> {
  const datos = await pedir<T[]>(ruta);
  return Array.isArray(datos) ? datos : [];
}

export async function pedirReporte(ruta: string, opciones?: OpcionesPedido): Promise<Reporte> {
  return adaptarReporte(await pedir<ReporteApi>(ruta, opciones));
}

export async function pedirReportes(ruta: string): Promise<Reporte[]> {
  const lista = await pedirLista<ReporteApi>(ruta);
  return lista.map(adaptarReporte);
}

/** Sube un archivo local y devuelve la URL que hay que mandar en el reporte. */
export async function subirArchivo(uri: string): Promise<string> {
  const nombre = uri.split("/").pop()?.split("?")[0] || "foto.jpg";
  const form = new FormData();
  const enNavegador =
    uri.startsWith("blob:") ||
    uri.startsWith("data:") ||
    (typeof document !== "undefined" && /^https?:\/\//.test(uri));

  if (enNavegador) {
    const archivo = await fetch(uri).then((respuesta) => respuesta.blob());
    form.append("archivo", archivo, nombre);
  } else {
    form.append("archivo", {
      uri,
      name: nombre,
      type: "image/jpeg",
    } as unknown as Blob);
  }

  const subido = await pedir<{ url: string }>("/archivos", {
    method: "POST",
    body: form,
    json: false,
  });
  return subido.url;
}
