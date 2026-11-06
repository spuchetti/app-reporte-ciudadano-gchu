import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

/** Mismo lenguaje visual que el pull-to-refresh nativo (círculo + acento). */
export function IndicadorRecarga({ visible }: { visible: boolean }) {
  const tema = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.capa}>
      <View
        style={[
          styles.circulo,
          {
            backgroundColor: tema.surface,
            borderColor: tema.outline,
            shadowColor: tema.ink,
          },
        ]}
      >
        <ActivityIndicator color={tema.primary} size="small" />
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
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 6,
  },
});
