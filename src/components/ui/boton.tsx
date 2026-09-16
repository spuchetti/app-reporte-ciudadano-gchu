import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { Paleta } from "@/constants/theme";

type Variante = "primario" | "secundario" | "texto";

type Props = PressableProps & {
  titulo: string;
  variante?: Variante;
  cargando?: boolean;
};

export function Boton({
  titulo,
  variante = "primario",
  cargando = false,
  disabled,
  ...rest
}: Props) {
  const inactivo = disabled || cargando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.base,
        variante === "primario" && styles.primario,
        variante === "secundario" && styles.secundario,
        variante === "texto" && styles.texto,
        pressed && !inactivo && styles.pressed,
        inactivo && styles.inactivo,
      ]}
      {...rest}
    >
      {cargando ? (
        <ActivityIndicator
          color={variante === "primario" ? Paleta.paperRaised : Paleta.teal}
        />
      ) : (
        <Text
          style={[
            styles.etiqueta,
            variante === "primario" && styles.etiquetaPrimario,
            variante === "secundario" && styles.etiquetaSecundario,
            variante === "texto" && styles.etiquetaTexto,
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primario: {
    backgroundColor: Paleta.teal,
  },
  secundario: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Paleta.teal,
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
    fontWeight: "600",
  },
  etiquetaPrimario: {
    color: Paleta.paperRaised,
  },
  etiquetaSecundario: {
    color: Paleta.teal,
  },
  etiquetaTexto: {
    color: Paleta.tealDeep,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
