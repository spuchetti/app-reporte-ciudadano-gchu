import React from "react";
import { Platform, StyleSheet, Text, View, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { reportesMock, tiposReporteMock } from "@/mocks/reportes";

const coloresEstado: Record<string, string> = {
  recibido: "#F2B705",
  en_revision: "#2E6E9E",
  asignado: "#E8630C",
  resuelto: "#2F9E52",
  rechazado: "#D64545"
};

export default function BandejaOperadorScreen() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  const renderItem = ({ item }: { item: typeof reportesMock[0] }) => {
    const tipo = tiposReporteMock.find((t) => t.id === item.tipoId);
    const colorEstado = coloresEstado[item.estado] || Paleta.inkSoft;

    return (
      <View style={styles.tarjeta}>
        <View style={styles.tarjetaCabecera}>
          <Text style={styles.codigo}>{item.codigo}</Text>
          <View style={[styles.insignia, { backgroundColor: colorEstado }]}>
            <Text style={styles.insigniaTexto}>
              {item.estado.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.tarjetaCuerpo}>
          <Text style={styles.tipo}>
            {tipo?.icono} {tipo?.nombre}
          </Text>
          <Text style={styles.direccion}>📍 {item.direccion}</Text>
          <Text style={styles.descripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>
        </View>

        <View style={styles.tarjetaPie}>
          <Text style={styles.fecha}>
            Ingresado: {new Date(item.creadoEn).toLocaleDateString("es-AR")}
          </Text>
          <View style={styles.botonContenedor}>
            <Boton 
              titulo="Gestionar" 
              variante="primario" 
              onPress={() => console.log(`Gestionar reporte: ${item.id}`)} 
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />
      
      <View style={[styles.cabecera, { paddingTop: Platform.OS === "web" ? 40 : insets.top + 20 }]}>
        <Text style={styles.titulo}>Bandeja de Gestión</Text>
        <Text style={styles.nombre}>{usuario?.nombre} - Operador</Text>
      </View>

      <FlatList
        data={reportesMock}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.pieLista}>
            <Text style={styles.email}>{usuario?.email}</Text>
            <Boton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paper,
  },
  cabecera: {
    backgroundColor: Paleta.orange,
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 2,
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 24,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  nombre: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  lista: {
    padding: 16,
    gap: 16,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  tarjetaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  codigo: {
    fontSize: 14,
    fontWeight: "bold",
    color: Paleta.ink,
  },
  insignia: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insigniaTexto: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tarjetaCuerpo: {
    marginBottom: 12,
  },
  tipo: {
    fontSize: 16,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 4,
  },
  direccion: {
    fontSize: 13,
    color: Paleta.inkSoft,
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 14,
    color: Paleta.ink,
    lineHeight: 20,
  },
  tarjetaPie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 12,
  },
  fecha: {
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  botonContenedor: {
    width: 140,
  },
  pieLista: {
    marginTop: 20,
    alignItems: "center",
    gap: 16,
  },
  email: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
});