import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { IconoCategoria } from "@/components/ui/icono-categoria";
import { InsigniaEstado } from "@/components/ui/insignia-estado";
import { Fonts, Paleta } from "@/constants/theme";
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

  const fondoTarjeta = tema.esOscuro ? "#10232B" : Paleta.tealDeep;
  const bordeTarjeta = tema.esOscuro ? "rgba(38, 198, 218, 0.3)" : "transparent";

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: fondoTarjeta,
          borderColor: bordeTarjeta,
          borderWidth: tema.esOscuro ? 1 : 0,
        },
      ]}
    >
      <View style={styles.filaCodigo}>
        <Text style={styles.codigo}>{codigo}</Text>
        <Ionicons name="location-outline" size={20} color="#FFFFFF" />
      </View>

      <Fila icono={tipoId ? null : "construct-outline"} tipoId={tipoId}>
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
          <InsigniaEstado
            estado={estadoClave}
            etiqueta={estado}
            sobreFondoOscuro
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
  return (
    <View style={styles.fila}>
      <View style={styles.burbuja}>
        {tipoId ? (
          <IconoCategoria tipoId={tipoId} size={16} color="#FFFFFF" />
        ) : icono ? (
          <Ionicons name={icono} size={16} color="#FFFFFF" />
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  filaCodigo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.28)",
  },
  codigo: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  burbuja: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  principal: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  secundario: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.82)",
  },
  direccion: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  pendiente: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: "#FFF4D6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendientePunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F2B705",
  },
  pendienteTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: "#785500",
  },
});