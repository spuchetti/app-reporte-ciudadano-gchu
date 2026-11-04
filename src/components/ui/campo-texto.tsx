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

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const tema = useTheme();
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const esClave = Boolean(secureTextEntry);
  const acento = rol === "operador" ? tema.secondary : tema.primary;

  return (
    <View style={styles.contenedor}>
      <View style={styles.filaEtiqueta}>
        <Text style={[styles.etiqueta, { color: tema.onSurface }]}>{etiqueta}</Text>
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
          {
            backgroundColor: tema.surface,
            borderColor: tema.outline,
          },
          enfocado && !error ? { borderColor: acento, borderWidth: 2 } : null,
          error ? { borderColor: tema.error } : null,
        ]}
      >
        {icono ? (
          <Ionicons
            name={icono}
            size={18}
            color={enfocado && !error ? acento : tema.onSurfaceVariant}
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
          placeholderTextColor={tema.onSurfaceVariant}
          style={[styles.input, { color: tema.onSurface }, style]}
        />
      </View>
      {error ? <Text style={[styles.error, { color: tema.error }]}>{error}</Text> : null}
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
    borderRadius: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
  },
});