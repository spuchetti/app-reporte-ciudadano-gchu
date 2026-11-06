import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Variante = "primario" | "secundario" | "texto";
type RolVisual = "vecino" | "operador";

type Props = PressableProps & {
  titulo: string;
  variante?: Variante;
  cargando?: boolean;
  rol?: RolVisual;
  icono?: ComponentProps<typeof Ionicons>["name"];
};

export function Boton({
  titulo,
  variante = "primario",
  cargando = false,
  rol = "vecino",
  icono,
  disabled,
  ...rest
}: Props) {
  const tema = useTheme();
  const inactivo = disabled || cargando;

  const colorPrimario = rol === "operador" ? tema.secondary : tema.primary;
  const colorTexto =
    rol === "operador"
      ? tema.esOscuro
        ? tema.secondary
        : tema.operadorDeep
      : tema.esOscuro
        ? tema.primary
        : tema.tealDeep;

  const colorIcono =
    variante === "primario"
      ? "#FFFFFF"
      : variante === "secundario"
        ? colorPrimario
        : colorTexto;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.base,
        variante === "primario" && { backgroundColor: colorPrimario },
        variante === "secundario" && [
          styles.secundario,
          { borderColor: colorPrimario },
        ],
        variante === "texto" && styles.texto,
        pressed && !inactivo && styles.pressed,
        inactivo && styles.inactivo,
      ]}
      {...rest}
    >
      {cargando ? (
        <ActivityIndicator
          color={variante === "primario" ? "#FFFFFF" : colorPrimario}
        />
      ) : (
        <View style={styles.contenido}>
          {icono ? (
            <Ionicons name={icono} size={18} color={colorIcono} />
          ) : null}
          <Text
            style={[
              styles.etiqueta,
              variante === "primario" && styles.etiquetaPrimario,
              variante === "secundario" && { color: colorPrimario },
              variante === "texto" && [styles.etiquetaTexto, { color: colorTexto }],
            ]}
          >
            {titulo}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secundario: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  texto: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.85,
  },
  inactivo: {
    opacity: 0.6,
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  etiqueta: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  etiquetaPrimario: {
    color: "#FFFFFF",
  },
  etiquetaTexto: {
    fontFamily: Fonts.medium,
  },
});