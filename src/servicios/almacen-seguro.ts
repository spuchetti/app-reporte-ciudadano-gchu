import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { borrarValorKV, guardarValorKV, leerValorKV } from "@/servicios/almacen-kv";

async function usarSecureStore() {
  if (Platform.OS === "web") {
    return false;
  }
  return SecureStore.isAvailableAsync();
}

export async function guardarSecreto(clave: string, valor: string) {
  await guardarValorKV(clave, valor);
  if (await usarSecureStore()) {
    await SecureStore.setItemAsync(clave, valor);
  }
}

export async function leerSecreto(clave: string): Promise<string | null> {
  const desdeKV = await leerValorKV(clave);
  if (desdeKV !== null) {
    return desdeKV;
  }
  if (await usarSecureStore()) {
    return SecureStore.getItemAsync(clave);
  }
  return null;
}

export async function borrarSecreto(clave: string) {
  await borrarValorKV(clave);
  if (await usarSecureStore()) {
    await SecureStore.deleteItemAsync(clave);
  }
}