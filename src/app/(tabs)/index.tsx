import { useCallback } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapaCiudadano } from "@/components/mapa/mapa-ciudadano";
import { BotonTema } from "@/components/ui/boton-tema";
import { useOrigenReporte } from "@/contexto/origen-reporte";

export default function HomeVecinoScreen() {
  const insets = useSafeAreaInsets();
  const { establecerOrigen } = useOrigenReporte();

  useFocusEffect(
    useCallback(() => {
      establecerOrigen("home");
    }, [establecerOrigen]),
  );

  return (
    <View style={styles.contenedor}>
      <MapaCiudadano />
      <View
        style={[
          styles.flotanteTema,
          { 
            bottom: (Platform.OS === "web" ? 20 : insets.bottom + 12) + 76, 
          },
        ]}
      >
        <BotonTema />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  flotanteTema: {
    position: "absolute",
    right: 18,
    zIndex: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});