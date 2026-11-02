import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Paleta } from "@/constants/theme";

/** Mismo lenguaje visual que el pull-to-refresh nativo (círculo blanco + teal). */
export function IndicadorRecarga({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.capa}>
      <View style={styles.circulo}>
        <ActivityIndicator color={Paleta.teal} size="small" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    paddingTop: 12,
    zIndex: 40,
    elevation: 40,
  },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 6,
  },
});
