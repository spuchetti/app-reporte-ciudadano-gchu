import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import {
  Fonts,
  Paleta,
  PaletaOperador,
  PaletaVecino,
} from "@/constants/theme";

type Props = TextInputProps & {
  etiqueta: string;
  error?: string | null;
  rol?: "vecino" | "operador";
};

export function CampoTexto({
  etiqueta,
  error,
  rol = "vecino",
  secureTextEntry,
  onFocus,
  onBlur,
  style,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const esClave = Boolean(secureTextEntry);
  const acento = rol === "operador"
    ? PaletaOperador.principal
    : PaletaVecino.principal;

  return (
    <View style={styles.contenedor}>
      <View style={styles.filaEtiqueta}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        {esClave ? (
          <Pressable
            onPress={() => setVisible((valor) => !valor)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            hitSlop={8}
          >
            <Text style={[styles.mostrar, { color: acento }]}>
              {visible ? "Ocultar" : "Mostrar"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        {...rest}
        onFocus={(evento) => {
          setEnfocado(true);
          onFocus?.(evento);
        }}
        onBlur={(evento) => {
          setEnfocado(false);
          onBlur?.(evento);
        }}
        secureTextEntry={esClave && !visible}
        placeholderTextColor={Paleta.inkSoft}
        style={[
          styles.input,
          enfocado && !error ? { borderColor: acento, borderWidth: 2 } : null,
          error ? styles.inputError : null,
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
  },
  filaEtiqueta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  etiqueta: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
  },
  mostrar: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Paleta.ink,
    backgroundColor: Paleta.paperRaised,
  },
  inputError: {
    borderColor: Paleta.rojo,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: Paleta.rojo,
  },
});
