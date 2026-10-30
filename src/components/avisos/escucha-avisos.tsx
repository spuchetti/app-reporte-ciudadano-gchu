import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { reporteIdDeAviso } from "@/servicios/notificaciones";

/** Abre el reporte cuando el vecino toca una push que trae `reporteId`. */
export function EscuchaAvisos() {
  const respuesta = Notifications.useLastNotificationResponse();
  const atendida = useRef<string | null>(null);

  useEffect(() => {
    if (
      !respuesta ||
      respuesta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    const reporteId = reporteIdDeAviso(respuesta.notification.request.content.data);
    const clave = respuesta.notification.request.identifier;
    if (!reporteId || atendida.current === clave) {
      return;
    }

    atendida.current = clave;
    Notifications.clearLastNotificationResponse();
    router.push(`/reclamo/${reporteId}`);
  }, [respuesta]);

  return null;
}
