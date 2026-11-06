/** KV en web sin expo-sqlite/kv-store (evita bundlear wa-sqlite.wasm). */

const memoriaRespaldo = new Map<string, string>();

function storageDisponible(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export async function guardarValorKV(clave: string, valor: string): Promise<void> {
  memoriaRespaldo.set(clave, valor);
  try {
    storageDisponible()?.setItem(clave, valor);
  } catch {
    // Solo memoria.
  }
}

export async function leerValorKV(clave: string): Promise<string | null> {
  try {
    const local = storageDisponible()?.getItem(clave);
    if (local !== null && local !== undefined) {
      memoriaRespaldo.set(clave, local);
      return local;
    }
  } catch {
    // Ignorar
  }
  return memoriaRespaldo.get(clave) ?? null;
}

export async function borrarValorKV(clave: string): Promise<void> {
  memoriaRespaldo.delete(clave);
  try {
    storageDisponible()?.removeItem(clave);
  } catch {
    // Ignorar
  }
}
