import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { Paleta } from "@/constants/theme";

type Props = TextInputProps & {
  etiqueta: string;
  error?: string | null;
};

export function CampoTexto({
  etiqueta,
  error,
  secureTextEntry,
  style,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);
  const esClave = Boolean(secureTextEntry);

  return (
    <View style={styles.contenedor}>
      <View style={styles.filaEtiqueta}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        {esClave ? (
          <Pressable
            onPress={() => setVisible((valor) => !valor)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Text style={styles.mostrar}>{visible ? "Ocultar" : "Mostrar"}</Text>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        {...rest}
        secureTextEntry={esClave && !visible}
        placeholderTextColor={Paleta.inkSoft}
        style={[styles.input, error ? styles.inputError : null, style]}
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
    fontWeight: "600",
    color: Paleta.ink,
  },
  mostrar: {
    fontSize: 13,
    fontWeight: "500",
    color: Paleta.teal,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 8,
    fontSize: 14,
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
