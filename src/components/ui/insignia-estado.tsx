import { StyleSheet, Text, View } from "react-native";

import { Fonts, Paleta } from "@/constants/theme";
import { EstadoReporte } from "@/tipos";

const COLORES_ESTADO = {
  recibido: {
    oscuro: { fondo: "#FFF1C2", texto: "#664800" },
    claro: { fondo: "#FFF4D6", texto: "#785500" },
  },
  en_revision: {
    oscuro: { fondo: "#DCEEFF", texto: "#174D78" },
    claro: { fondo: "#E5F0FA", texto: "#245C85" },
  },
  asignado: {
    oscuro: { fondo: "#FFE4D1", texto: "#8A3900" },
    claro: { fondo: "#FFF0E4", texto: "#9D4308" },
  },
  resuelto: {
    oscuro: { fondo: "#C8EBD4", texto: "#145C32" },
    claro: { fondo: "#C9EED4", texto: "#145C32" },
  },
  rechazado: {
    oscuro: { fondo: "#FCE3E3", texto: "#A32E2E" },
    claro: { fondo: "#FCE9E9", texto: "#A32E2E" },
  },
} as const;

const COLORES_PENDIENTE = {
  fondo: "#EEF1F4",
  texto: Paleta.inkSoft,
};

type Props = {
  estado: EstadoReporte;
  etiqueta: string;
  sobreFondoOscuro?: boolean;
  colorOverride?: string;
  maxWidth?: number;
  lineas?: number;
};

export function InsigniaEstado({
  estado,
  etiqueta,
  sobreFondoOscuro = false,
  colorOverride,
  maxWidth,
  lineas = 2,
}: Props) {
  const color = COLORES_ESTADO[estado][sobreFondoOscuro ? "oscuro" : "claro"];
  const colores = colorOverride
    ? COLORES_PENDIENTE
    : color;

  return (
    <View
      style={[
        styles.insignia,
        {
          backgroundColor: colores.fondo,
          maxWidth,
        },
      ]}
    >
      <Text
        numberOfLines={lineas}
        style={[styles.texto, { color: colores.texto }]}
      >
        {etiqueta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  insignia: {
    alignSelf: "flex-start",
    minHeight: 32,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  texto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    textAlign: "center",
  },
});
