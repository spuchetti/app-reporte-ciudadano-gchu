/**
 * Stub web: no importa expo-notifications (APIs nativas inexistentes).
 */

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

export async function registrarDispositivo() {
  return;
}

export async function darDeBajaDispositivo() {
  return;
}
