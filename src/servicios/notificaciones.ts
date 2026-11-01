import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { borrarSecreto, guardarSecreto, leerSecreto } from "@/servicios/almacen-seguro";
import { enPrueba, pedir } from "@/servicios/api";

const CLAVE_TOKEN = "tokenExpo";
const PROJECT_ID_PENDIENTE = "tu-project-id-aqui";
const CANAL_AVISOS = "default";

/** La push de la API manda `reporteId` en `data`. La de prueba no. */
export function reporteIdDeAviso(datos: unknown): string | null {
  if (!datos || typeof datos !== "object" || !("reporteId" in datos)) {
    return null;
  }
  const id = (datos as { reporteId?: unknown }).reporteId;
  if (typeof id !== "string") {
    return null;
  }
  const limpio = id.trim();
  return limpio === "" ? null : limpio;
}

async function asegurarCanalAndroid() {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync(CANAL_AVISOS, {
    name: "Avisos",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function projectId(): string | null {
  const id = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof id !== "string" || id.trim() === "" || id === PROJECT_ID_PENDIENTE) {
    return null;
  }
  return id;
}

/** Después de ingresar, registra este teléfono para recibir avisos. Si no se puede, la sesión sigue. */
export async function registrarDispositivo() {
  if (enPrueba() || Platform.OS === "web" || !Device.isDevice) {
    return;
  }

  try {
    await asegurarCanalAndroid();
    const actual = await Notifications.getPermissionsAsync();
    const permiso =
      actual.status === "granted"
        ? actual
        : await Notifications.requestPermissionsAsync();
    if (permiso.status !== "granted") {
      return;
    }

    const id = projectId();
    if (!id) {
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
    await pedir("/dispositivos", {
      method: "POST",
      body: JSON.stringify({
        tokenExpo: token,
        plataforma: Platform.OS === "ios" ? "ios" : "android",
      }),
    });
    await guardarSecreto(CLAVE_TOKEN, token);
  } catch (error) {
    console.warn("No se pudo registrar el teléfono para avisos:", error);
  }
}

/** Al cerrar sesión, da de baja el token mientras la sesión todavía existe. */
export async function darDeBajaDispositivo() {
  if (enPrueba()) {
    return;
  }

  const token = await leerSecreto(CLAVE_TOKEN);
  if (!token) {
    return;
  }

  try {
    await pedir(`/dispositivos/${encodeURIComponent(token)}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.warn("No se pudo dar de baja el teléfono:", error);
  } finally {
    await borrarSecreto(CLAVE_TOKEN);
  }
}
