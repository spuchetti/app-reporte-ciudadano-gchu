import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  mostrarTexto?: boolean;
  sobreFondoOscuro?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BotonTema({ mostrarTexto = false, sobreFondoOscuro = false, style }: Props) {
  const tema = useTheme();

  const fondo = sobreFondoOscuro
    ? "rgba(255, 255, 255, 0.14)"
    : tema.surfaceVariant;
  const borde = sobreFondoOscuro
    ? "rgba(255, 255, 255, 0.24)"
    : tema.outline;
  const colorContenido = sobreFondoOscuro ? "#FFFFFF" : tema.onSurface;
  const colorIcono = tema.esOscuro ? tema.amarillo : colorContenido;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        tema.esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      hitSlop={8}
      onPress={tema.alternarTema}
      style={({ pressed }) => [
        styles.boton,
        {
          backgroundColor: fondo,
          borderColor: borde,
        },
        !mostrarTexto && styles.botonIconoSolo,
        pressed && styles.presionado,
        style,
      ]}
    >
      <Ionicons
        name={tema.esOscuro ? "sunny" : "moon"}
        size={18}
        color={colorIcono}
      />
      {mostrarTexto ? (
        <Text style={[styles.texto, { color: colorContenido }]}>
          {tema.esOscuro ? "Claro" : "Oscuro"}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
  },
  botonIconoSolo: {
    width: 38,
    height: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  presionado: {
    opacity: 0.78,
  },
  texto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
});