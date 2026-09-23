import { type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Paleta } from "@/constants/theme";

type MapViewProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  mensaje?: string;
  [clave: string]: unknown;
};

export function MapView({
  style,
  mensaje = "El mapa con las calles de Gualeguaychú se ve en el celular.",
}: MapViewProps) {
  return (
    <View style={[styles.base, style]} accessibilityLabel="Mapa no disponible en web">
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

export function Marker(_props: Record<string, unknown>) {
  return null;
}

export function Callout({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export default MapView;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E1F5EE",
    padding: 16,
  },
  texto: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: Paleta.inkSoft,
  },
});
