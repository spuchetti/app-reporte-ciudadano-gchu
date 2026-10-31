import { useEffect, useRef } from "react";
import { useNetworkState } from "expo-network";

import { sincronizarPendientes } from "@/servicios/reportes";

/**
 * Cuando vuelve internet, intenta vaciar la cola SQLite de reportes pendientes.
 */
export function EscuchaRed() {
  const red = useNetworkState();
  const habiaInternet = useRef<boolean | null>(null);
  const sincronizando = useRef(false);

  useEffect(() => {
    const online = red.isInternetReachable === true;
    const antes = habiaInternet.current;
    habiaInternet.current = online;

    if (!online || sincronizando.current) {
      return;
    }

    // Primera lectura online, o recuperación tras estar offline.
    if (antes === false || antes === null) {
      sincronizando.current = true;
      void sincronizarPendientes()
        .catch(() => undefined)
        .finally(() => {
          sincronizando.current = false;
        });
    }
  }, [red.isInternetReachable]);

  return null;
}
