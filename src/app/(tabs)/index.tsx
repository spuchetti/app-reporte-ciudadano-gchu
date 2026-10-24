import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

import { MapaCiudadano } from "@/components/mapa/mapa-ciudadano";
import { useOrigenReporte } from "@/contexto/origen-reporte";

export default function HomeVecinoScreen() {
  const { establecerOrigen } = useOrigenReporte();

  useFocusEffect(
    useCallback(() => {
      establecerOrigen("home");
    }, [establecerOrigen]),
  );

  return <MapaCiudadano />;
}
