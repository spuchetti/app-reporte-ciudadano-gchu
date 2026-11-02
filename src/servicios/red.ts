import * as Network from "expo-network";

/** true solo si hay alcance a internet. null/false → tratamos como offline. */
export async function hayInternet(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync();
    if (estado.isInternetReachable === true) {
      return true;
    }
    // Algunos dispositivos dejan isInternetReachable en null con Wi‑Fi activo.
    if (
      estado.isInternetReachable == null &&
      estado.isConnected === true &&
      estado.type !== Network.NetworkStateType.NONE &&
      estado.type !== Network.NetworkStateType.UNKNOWN
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
