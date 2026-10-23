import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Fonts, Paleta } from "@/constants/theme";

type Props = {
  codigo: string;
  tipoNombre: string;
  area: string;
  direccion: string;
  estado?: string;
};

export function TicketReporte({
  codigo,
  tipoNombre,
  area,
  direccion,
  estado = "Recibido",
}: Props) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.filaCodigo}>
        <Text style={styles.codigo}>{codigo}</Text>
        <Ionicons name="location" size={20} color={Paleta.paperRaised} />
      </View>
      <View style={styles.linea} />
      <View style={styles.fila}>
        <Text style={styles.principal}>{tipoNombre}</Text>
        <Text style={styles.secundario}>{area}</Text>
      </View>
      <Text style={styles.direccion}>{direccion}</Text>
      <View style={styles.fila}>
        <Text style={styles.secundario}>Estado</Text>
        <Text style={styles.principal}>{estado}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: Paleta.tealDeep,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  filaCodigo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codigo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    fontWeight: "700",
    color: Paleta.paperRaised,
  },
  linea: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 4,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  principal: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  secundario: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  direccion: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.paperRaised,
  },
});
