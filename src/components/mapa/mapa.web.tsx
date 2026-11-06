import { type ReactNode, type Ref } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { LogoMarca } from "@/components/ui/logo-marca";
import { Fonts, Paleta } from "@/constants/theme";

type MapViewProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  mensaje?: string;
  ref?: Ref<View>;
  [clave: string]: unknown;
};

export function MapView({
  style,
  mensaje = "El mapa con las calles de Gualeguaychú se ve en el celular.",
  ref,
}: MapViewProps) {
  return (
    <View
      ref={ref}
      style={[styles.base, style]}
      accessibilityLabel="Mapa no disponible en web"
    >
      <LogoMarca size={64} />
      <View style={styles.badge}>
        <Ionicons name="phone-portrait-outline" size={18} color={Paleta.tealDeep} />
        <Text style={styles.badgeTexto}>Disponible en la app</Text>
      </View>
      <Text style={styles.titulo}>Mapa interactivo en el celular</Text>
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
    backgroundColor: "#D8F0EA",
    paddingHorizontal: 28,
    paddingVertical: 32,
    gap: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Paleta.paperRaised,
  },
  badgeTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Paleta.tealDeep,
  },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.ink,
    textAlign: "center",
    marginTop: 4,
  },
  texto: {
    textAlign: "center",
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: Paleta.inkSoft,
    maxWidth: 360,
  },
});
