import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
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

  return (
    <View style={styles.contenedor}>
      <MapaCiudadano />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
});
