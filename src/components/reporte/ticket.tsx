import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { IconoCategoria } from "@/components/ui/icono-categoria";
import { InsigniaEstado } from "@/components/ui/insignia-estado";
import { Fonts, Paleta } from "@/constants/theme";
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
  return (
    <View style={styles.tarjeta}>
      <View style={styles.filaCodigo}>
        <Text style={styles.codigo}>{codigo}</Text>
        <Ionicons name="location-outline" size={20} color={Paleta.paperRaised} />
      </View>
      <Fila
        icono={tipoId ? null : "construct-outline"}
        tipoId={tipoId}
      >
        <Text style={styles.principal}>{tipoNombre}</Text>
        {area ? <Text style={styles.secundario}>{area}</Text> : null}
      </Fila>
      <Fila icono="location-outline">
        <Text style={styles.direccion}>{direccion}</Text>
      </Fila>
      <Fila icono="time-outline">
        <Text style={styles.secundario}>Estado</Text>
        {pendiente ? (
          <View style={styles.pendiente}>
            <View style={styles.pendientePunto} />
            <Text style={styles.pendienteTexto}>{estado}</Text>
          </View>
        ) : (
          <InsigniaEstado estado={estadoClave} etiqueta={estado} sobreFondoOscuro />
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
  return (
    <View style={styles.fila}>
      <View style={styles.burbuja}>
        {tipoId ? (
          <IconoCategoria tipoId={tipoId} size={16} color={Paleta.paperRaised} />
        ) : icono ? (
          <Ionicons name={icono} size={16} color={Paleta.paperRaised} />
        ) : null}
      </View>
      <View style={styles.filaTexto}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: Paleta.tealDeep,
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
    borderBottomColor: "rgba(255,255,255,0.72)",
  },
  codigo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.paperRaised,
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
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
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
    color: Paleta.paperRaised,
  },
  secundario: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  direccion: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Paleta.paperRaised,
    lineHeight: 20,
  },
  pendiente: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: "#FFF6DC",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendientePunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Paleta.amarillo,
  },
  pendienteTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: "#3F3420",
  },
});
