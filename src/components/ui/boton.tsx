import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { Fonts, PaletaOperador, PaletaVecino } from "@/constants/theme";

type Variante = "primario" | "secundario" | "texto";
type RolVisual = "vecino" | "operador";

type Props = PressableProps & {
  titulo: string;
  variante?: Variante;
  cargando?: boolean;
  rol?: RolVisual;
};

export function Boton({
  titulo,
  variante = "primario",
  cargando = false,
  rol = "vecino",
  disabled,
  ...rest
}: Props) {
  const inactivo = disabled || cargando;
  const colorPrimario =
    rol === "operador" ? PaletaOperador.principal : PaletaVecino.principal;
  const colorOscuro =
    rol === "operador" ? PaletaOperador.oscura : PaletaVecino.oscura;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.base,
        variante === "primario" && { backgroundColor: colorPrimario },
        variante === "secundario" && styles.secundario,
        variante === "secundario" && { borderColor: colorPrimario },
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
        <Text
          style={[
            styles.etiqueta,
            variante === "primario" && styles.etiquetaPrimario,
            variante === "secundario" && { color: colorPrimario },
            variante === "texto" && styles.etiquetaTexto,
            variante === "texto" && { color: colorOscuro },
          ]}
        >
          {titulo}
        </Text>
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
