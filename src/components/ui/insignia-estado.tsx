import { StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { COLORES_ESTADO as COLORES_PUNTO } from "@/servicios/mapa";
import { EstadoReporte } from "@/tipos";

const COLORES_INSIGNIA_CLARO = {
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

const COLORES_INSIGNIA_OSCURO: Record<EstadoReporte, { fondo: string; texto: string }> = {
  recibido: { fondo: "rgba(250, 204, 21, 0.18)", texto: "#FDE047" },
  en_revision: { fondo: "rgba(96, 165, 250, 0.18)", texto: "#93C5FD" },
  asignado: { fondo: "rgba(251, 146, 60, 0.18)", texto: "#FDBA74" },
  resuelto: { fondo: "rgba(74, 222, 128, 0.18)", texto: "#86EFAC" },
  rechazado: { fondo: "rgba(248, 113, 113, 0.18)", texto: "#FCA5A5" },
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
  const tema = useTheme();

  const base = tema.esOscuro
    ? COLORES_INSIGNIA_OSCURO[estado]
    : COLORES_INSIGNIA_CLARO[estado][sobreFondoOscuro ? "oscuro" : "claro"];

  const puntoColor = COLORES_PUNTO[estado] ?? tema.primary;

  const colores = colorOverride
    ? {
        fondo: tema.surfaceVariant,
        texto: tema.onSurfaceVariant,
        punto: tema.onSurfaceVariant,
      }
    : {
        fondo: base.fondo,
        texto: base.texto,
        punto: puntoColor,
      };

  return (
    <View
      style={[
        styles.insignia,
        {
          backgroundColor: colores.fondo,
          borderColor: tema.esOscuro ? tema.outline : "transparent",
          borderWidth: tema.esOscuro ? 1 : 0,
          maxWidth,
        },
      ]}
    >
      <View style={[styles.punto, { backgroundColor: colores.punto }]} />
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    textAlign: "center",
  },
});