import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Network from "expo-network";

import {
  completarIdentidadPendiente,
  hayIdentidadPendiente,
} from "@/servicios/auth";
import { listarReportesPendientesSQLite } from "@/servicios/base-datos";
import {
  avisarColaReportesActualizada,
  avisarEstadoSincronizacionRed,
  precargarTiposReporte,
  sincronizarPendientes,
} from "@/servicios/reportes";

const INTERVALO_REINTENTO_MS = 20_000;

/** Solo sincronizamos cuando el SO confirma alcance real a internet. */
function listoParaEnviar(estado: {
  isInternetReachable?: boolean | null;
}): boolean {
  return estado.isInternetReachable === true;
}

/**
 * Cuando hay internet (o vuelve): completa identidad offline si hace falta,
 * vacía la cola SQLite y avisa a la UI. Sin botón ni refresh manual.
 */
export function EscuchaRed() {
  const habiaAlcance = useRef<boolean | null>(null);
  const sincronizando = useRef(false);

  async function hayTrabajoPendiente() {
    if (await hayIdentidadPendiente()) {
      return true;
    }
    const cola = await listarReportesPendientesSQLite();
    return cola.length > 0;
  }

  async function intentarSincronizar(opciones?: { mostrarUi?: boolean }) {
    if (sincronizando.current) {
      return;
    }
    const mostrarUi = opciones?.mostrarUi === true;
    sincronizando.current = true;
    if (mostrarUi) {
      avisarEstadoSincronizacionRed(true);
    }
    try {
      await completarIdentidadPendiente();
      await sincronizarPendientes();
      await precargarTiposReporte();
      avisarColaReportesActualizada();
    } catch {
      // Se reintenta en el próximo evento de red / intervalo / foco.
    } finally {
      sincronizando.current = false;
      if (mostrarUi) {
        avisarEstadoSincronizacionRed(false);
      }
    }
  }

  useEffect(() => {
    const sub = Network.addNetworkStateListener((estado) => {
      const online = listoParaEnviar(estado);
      const antes = habiaAlcance.current;
      habiaAlcance.current = online;

      if (!online) {
        return;
      }

      // Recuperación de red o primera lectura con internet confirmado.
      if (antes === false || antes === null) {
        void intentarSincronizar({ mostrarUi: antes === false });
      }
    });

    void Network.getNetworkStateAsync().then((estado) => {
      const online = listoParaEnviar(estado);
      const antes = habiaAlcance.current;
      habiaAlcance.current = online;
      if (online && (antes === false || antes === null)) {
        // Arranque en línea: sync silencioso. Vuelta de offline: con indicador.
        void intentarSincronizar({ mostrarUi: antes === false });
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    function alCambiarApp(estado: AppStateStatus) {
      if (estado !== "active") {
        return;
      }
      void Network.getNetworkStateAsync().then((red) => {
        if (listoParaEnviar(red)) {
          void intentarSincronizar({ mostrarUi: false });
        }
      });
    }
    const sub = AppState.addEventListener("change", alCambiarApp);
    return () => sub.remove();
  }, []);

  // Reintento periódico: si el primer sync falló (API/geocode) y sigue habiendo cola.
  useEffect(() => {
    const id = setInterval(() => {
      void (async () => {
        const red = await Network.getNetworkStateAsync();
        if (!listoParaEnviar(red)) {
          return;
        }
        if (!(await hayTrabajoPendiente())) {
          return;
        }
        await intentarSincronizar({ mostrarUi: false });
      })();
    }, INTERVALO_REINTENTO_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
