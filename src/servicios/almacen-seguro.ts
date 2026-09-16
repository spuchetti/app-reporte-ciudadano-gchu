import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

async function usarSecureStore() {
  if (Platform.OS === "web") {
    return false;
  }
  return SecureStore.isAvailableAsync();
}

export async function guardarSecreto(clave: string, valor: string) {
  if (await usarSecureStore()) {
    await SecureStore.setItemAsync(clave, valor);
    return;
  }

  try {
    localStorage.setItem(clave, valor);
  } catch (error) {
    console.error("No se pudo guardar el secreto:", error);
  }
}

export async function leerSecreto(clave: string): Promise<string | null> {
  if (await usarSecureStore()) {
    return SecureStore.getItemAsync(clave);
  }

  try {
    return localStorage.getItem(clave);
  } catch (error) {
    console.error("No se pudo leer el secreto:", error);
    return null;
  }
}

export async function borrarSecreto(clave: string) {
  if (await usarSecureStore()) {
    await SecureStore.deleteItemAsync(clave);
    return;
  }

  try {
    localStorage.removeItem(clave);
  } catch (error) {
    console.error("No se pudo borrar el secreto:", error);
  }
}
