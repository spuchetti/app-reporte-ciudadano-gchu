import { Image } from "expo-image";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import IconoSvg from "@/assets/branding/icono_principal.svg";

type Props = {
  size: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Fondo claro detrás del logo (paneles oscuros en web). */
  sobreOscuro?: boolean;
};

/**
 * Marca de la app. En web usa PNG (SVG a veces no pinta bien);
 * en nativo sigue el SVG.
 */
export function LogoMarca({
  size,
  accessibilityLabel = "Reporte Ciudadano",
  style,
  sobreOscuro = false,
}: Props) {
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.caja,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.22),
            backgroundColor: sobreOscuro ? "#FFFFFF" : "transparent",
          },
          style,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
      >
        <Image
          source={require("../../../assets/branding/icono_principal.png")}
          style={{ width: size, height: size }}
          contentFit="contain"
          accessibilityLabel={accessibilityLabel}
        />
      </View>
    );
  }

  return (
    <IconoSvg
      width={size}
      height={size}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  caja: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
