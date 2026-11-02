import * as LocalAuthentication from "expo-local-authentication";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";

import {
  borrarValorKV,
  guardarValorKV,
  leerValorKV,
} from "@/servicios/almacen-kv";
import { ErrorServicio } from "@/servicios/error";
import { MetodoIngreso, Rol } from "@/tipos";

const CLAVE_BLOQUEADA = "sesionBloqueada";
const CLAVE_PREFERENCIAS = "preferenciaIngreso";

type Preferencias = Partial<Record<Rol, { metodo: MetodoIngreso }>>;

async function leerPreferencias(): Promise<Preferencias> {
  const crudo = await leerValorKV(CLAVE_PREFERENCIAS);
  if (!crudo) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(crudo);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as Preferencias;
  } catch {
    return {};
  }
}

async function guardarPreferencias(valor: Preferencias) {
  await guardarValorKV(CLAVE_PREFERENCIAS, JSON.stringify(valor));
}

export async function leerMetodoIngreso(rol: Rol): Promise<MetodoIngreso | null> {
  const prefs = await leerPreferencias();
  return prefs[rol]?.metodo ?? null;
}

export async function guardarMetodoIngreso(rol: Rol, metodo: MetodoIngreso) {
  const prefs = await leerPreferencias();
  prefs[rol] = { metodo };
  await guardarPreferencias(prefs);
}

export async function borrarMetodoIngreso(rol: Rol) {
  const prefs = await leerPreferencias();
  delete prefs[rol];
  await guardarPreferencias(prefs);
}

export async function borrarPreferenciasIngreso() {
  await borrarValorKV(CLAVE_PREFERENCIAS);
}

export async function marcarSesionBloqueada() {
  await guardarValorKV(CLAVE_BLOQUEADA, "1");
}

export async function marcarSesionDesbloqueada() {
  await borrarValorKV(CLAVE_BLOQUEADA);
}

export async function sesionEstaBloqueada(): Promise<boolean> {
  return (await leerValorKV(CLAVE_BLOQUEADA)) === "1";
}

export function corriendoEnExpoGo() {
  return Constants.executionEnvironment === "storeClient";
}

export function ingresoRapidoDisponible() {
  return Platform.OS !== "web";
}

export async function dispositivoTieneRostro(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const enrolado = await LocalAuthentication.isEnrolledAsync();
  return (
    enrolado &&
    tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  );
}

/** Evita pelear con el resume del SO / keep-awake justo al prender la pantalla. */
async function esperarPantallaActiva() {
  if (Platform.OS === "web") {
    return;
  }

  if (AppState.currentState !== "active") {
    await Promise.race([
      new Promise<void>((resolve) => {
        const sub = AppState.addEventListener("change", (estado) => {
          if (estado === "active") {
            sub.remove();
            resolve();
          }
        });
      }),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 4_000);
      }),
    ]);
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 250);
  });
}

export async function confirmarIdentidadDispositivo(
  modo: "rostro" | "pin",
): Promise<void> {
  await esperarPantallaActiva();

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage:
      modo === "pin"
        ? "Confirmá el código de tu teléfono"
        : "Confirmá tu identidad para continuar",
    cancelLabel: "Cancelar",
    fallbackLabel: "Usar el código del teléfono",
    disableDeviceFallback: false,
  });

  if (resultado.success) {
    return;
  }

  const cancelo =
    resultado.error === "user_cancel" ||
    resultado.error === "system_cancel" ||
    resultado.error === "app_cancel";

  throw new ErrorServicio({
    codigo: cancelo ? "ROSTRO_CANCELADO" : "ROSTRO_NO_DISPONIBLE",
    mensaje: cancelo
      ? "Cancelaste. Podés usar tus datos."
      : modo === "pin"
        ? "No se pudo usar el código del teléfono. Probá de nuevo o usá tus datos."
        : "No se pudo confirmar el rostro. Probá de nuevo o usá el código del teléfono.",
  });
}
