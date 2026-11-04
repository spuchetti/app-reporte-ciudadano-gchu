import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { IconoCategoria } from "@/components/ui/icono-categoria";
import { InsigniaEstado } from "@/components/ui/insignia-estado";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { EstadoReporte } from "@/tipos";

type Props = {
  codigo: string;
  tipoId?: string;
  tipoNombre: string;
  area: string;
  direccion: string;
  estado?: string;
  estadoClave?: EstadoReporte;
  pendiente?: boolean;
};

export function TicketReporte({
  codigo,
  tipoId,
  tipoNombre,
  area,
  direccion,
  estado = "Recibido",
  estadoClave = "recibido",
  pendiente = false,
}: Props) {
  const tema = useTheme();

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: tema.primaryContainer,
          borderColor: tema.outline,
          borderWidth: 1,
        },
      ]}
    >
      <View
        style={[
          styles.filaCodigo,
          {
            borderBottomColor: tema.esOscuro
              ? "rgba(255,255,255,0.18)"
              : "rgba(0,0,0,0.12)",
          },
        ]}
      >
        <Text style={[styles.codigo, { color: tema.onPrimaryContainer }]}>{codigo}</Text>
        <Ionicons name="location-outline" size={20} color={tema.onPrimaryContainer} />
      </View>
      <Fila icono={tipoId ? null : "construct-outline"} tipoId={tipoId}>
        <Text style={[styles.principal, { color: tema.onPrimaryContainer }]}>
          {tipoNombre}
        </Text>
        {area ? (
          <Text
            style={[
              styles.secundario,
              {
                color: tema.esOscuro
                  ? "rgba(255,255,255,0.76)"
                  : "rgba(0,0,0,0.64)",
              },
            ]}
          >
            {area}
          </Text>
        ) : null}
      </Fila>
      <Fila icono="location-outline">
        <Text style={[styles.direccion, { color: tema.onPrimaryContainer }]}>
          {direccion}
        </Text>
      </Fila>
      <Fila icono="time-outline">
        <Text
          style={[
            styles.secundario,
            {
              color: tema.esOscuro
                ? "rgba(255,255,255,0.76)"
                : "rgba(0,0,0,0.64)",
            },
          ]}
        >
          Estado
        </Text>
        {pendiente ? (
          <View
            style={[
              styles.pendiente,
              {
                backgroundColor: tema.esOscuro
                  ? "rgba(250, 204, 21, 0.18)"
                  : "#FFF6DC",
              },
            ]}
          >
            <View
              style={[
                styles.pendientePunto,
                { backgroundColor: tema.amarillo },
              ]}
            />
            <Text
              style={[
                styles.pendienteTexto,
                { color: tema.esOscuro ? tema.amarillo : "#3F3420" },
              ]}
            >
              {estado}
            </Text>
          </View>
        ) : (
          <InsigniaEstado
            estado={estadoClave}
            etiqueta={estado}
            sobreFondoOscuro={tema.esOscuro}
          />
        )}
      </Fila>
    </View>
  );
}

function Fila({
  icono,
  tipoId,
  children,
}: {
  icono: "construct-outline" | "location-outline" | "time-outline" | null;
  tipoId?: string;
  children: ReactNode;
}) {
  const tema = useTheme();

  return (
    <View style={styles.fila}>
      <View
        style={[
          styles.burbuja,
          {
            backgroundColor: tema.esOscuro
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.06)",
            borderColor: tema.esOscuro
              ? "rgba(255,255,255,0.22)"
              : "rgba(0,0,0,0.12)",
          },
        ]}
      >
        {tipoId ? (
          <IconoCategoria tipoId={tipoId} size={16} color={tema.onPrimaryContainer} />
        ) : icono ? (
          <Ionicons name={icono} size={16} color={tema.onPrimaryContainer} />
        ) : null}
      </View>
      <View style={styles.filaTexto}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 16,
  },
  filaCodigo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  codigo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  burbuja: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  principal: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  secundario: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  direccion: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 20,
  },
  pendiente: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendientePunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pendienteTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
});