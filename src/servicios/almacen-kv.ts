import Storage from "expo-sqlite/kv-store";

const memoriaRespaldo = new Map<string, string>();

export async function guardarValorKV(clave: string, valor: string): Promise<void> {
  memoriaRespaldo.set(clave, valor);
  try {
    await Storage.setItem(clave, valor);
  } catch {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(clave, valor);
      }
    } catch {
      // Fallback en memoria si el binario nativo aún no tiene expo-sqlite compilado
    }
  }
}

export async function leerValorKV(clave: string): Promise<string | null> {
  try {
    const valor = await Storage.getItem(clave);
    if (valor !== null && valor !== undefined) {
      memoriaRespaldo.set(clave, valor);
      return valor;
    }
  } catch {
    try {
      if (typeof localStorage !== "undefined") {
        const local = localStorage.getItem(clave);
        if (local !== null) return local;
      }
    } catch {
      // Ignorar
    }
  }
  return memoriaRespaldo.get(clave) ?? null;
}

export async function borrarValorKV(clave: string): Promise<void> {
  memoriaRespaldo.delete(clave);
  try {
    await Storage.removeItem(clave);
  } catch {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(clave);
      }
    } catch {
      // Ignorar
    }
  }
}