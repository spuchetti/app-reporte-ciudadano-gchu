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
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const tema = useTheme();

  return (
    <View
      ref={ref}
      style={[
        styles.base,
        { backgroundColor: tema.tealSoft },
        style,
      ]}
      accessibilityLabel="Mapa no disponible en web"
    >
      <LogoMarca size={64} />
      <View style={[styles.badge, { backgroundColor: tema.surface }]}>
        <Ionicons
          name="phone-portrait-outline"
          size={18}
          color={tema.tealDeep}
        />
        <Text style={[styles.badgeTexto, { color: tema.tealDeep }]}>
          Disponible en la app
        </Text>
      </View>
      <Text style={[styles.titulo, { color: tema.onSurface }]}>
        Mapa interactivo en el celular
      </Text>
      <Text style={[styles.texto, { color: tema.onSurfaceVariant }]}>
        {mensaje}
      </Text>
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
  },
  badgeTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    textAlign: "center",
    marginTop: 4,
  },
  texto: {
    textAlign: "center",
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 360,
  },
});
