import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
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
  icono?: ComponentProps<typeof Ionicons>["name"];
};

export function CampoTexto({
  etiqueta,
  error,
  rol = "vecino",
  icono,
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
      <View
        style={[
          styles.campo,
          enfocado && !error ? { borderColor: acento, borderWidth: 2 } : null,
          error ? styles.inputError : null,
        ]}
      >
        {icono ? (
          <Ionicons
            name={icono}
            size={18}
            color={enfocado && !error ? acento : Paleta.inkSoft}
          />
        ) : null}
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
          style={[styles.input, style]}
        />
      </View>
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
  campo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 12,
    backgroundColor: Paleta.paperRaised,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Paleta.ink,
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
