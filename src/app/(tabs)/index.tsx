import React, { useState } from "react";
import { Platform, StyleSheet, Text, View, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import MapView, { Marker, Callout } from "react-native-maps";
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

export default function HomeVecinoScreen() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
  const router = useRouter();

  const [region] = useState({
    latitude: -33.0094,
    longitude: -58.5145,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />

      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === "web" ? 88 : insets.top + 20 },
        ]}
      >
        <View>
          <Text style={styles.saludo}>Hola</Text>
          <Text style={styles.nombre}>{usuario?.nombre ?? "Vecino"}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>👤</Text>
        </View>
      </View>

      <View style={styles.mapaContainer}>
        <MapView style={styles.mapa} initialRegion={region}>
          {reportesMock.map((reporte) => {
            const tipo = tiposReporteMock.find(t => t.id === reporte.tipoId);
            const colorPin = coloresEstado[reporte.estado] || Paleta.orange;
            const fotoPrincipal = reporte.fotos.find(f => f.esPrincipal)?.url;
            
            return (
              <Marker
                key={reporte.id}
                coordinate={{ 
                  latitude: reporte.coordenadas.latitud, 
                  longitude: reporte.coordenadas.longitud 
                }}
                pinColor={colorPin} 
              >
                <Callout>
                  <View style={styles.burbujaInfo}>
                    {fotoPrincipal ? (
                      <Image 
                        source={{ uri: fotoPrincipal }} 
                        style={styles.miniatura} 
                        resizeMode="cover" 
                      />
                    ) : null}
                    <Text style={styles.tituloBurbuja}>
                      {`${tipo?.icono || "📌"} ${tipo?.nombre || "Reporte"}`}
                    </Text>
                    <Text style={styles.textoBurbuja}>
                      {reporte.descripcion || ""}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        <Pressable 
          style={styles.fab} 
          onPress={() => router.push("/reportar")}
        >
          <Text style={styles.fabTexto}>+</Text>
        </Pressable>

        <View style={[styles.botonCerrar, { bottom: insets.bottom + 20 }]}>
          <Boton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Paleta.paper },
  cabecera: {
    backgroundColor: Paleta.teal,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  saludo: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  nombre: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 20,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  avatar: {
    width: 40, height: 40, backgroundColor: Paleta.orange,
    borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  avatarTexto: { fontSize: 20 },
  mapaContainer: { flex: 1, position: "relative" },
  mapa: { width: "100%", height: "100%" },
  fab: {
    position: "absolute", top: 20, right: 20, backgroundColor: Paleta.orange,
    width: 60, height: 60, borderRadius: 30, justifyContent: "center",
    alignItems: "center", elevation: 5, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
  },
  fabTexto: { color: Paleta.paper, fontSize: 35, fontWeight: "bold", lineHeight: 40 },
  botonCerrar: { position: "absolute", alignSelf: "center", width: "80%" },
  burbujaInfo: {
    width: 250,
    padding: 8,
  },
  miniatura: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  tituloBurbuja: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: Paleta.ink,
  },
  textoBurbuja: {
    fontSize: 14,
    color: Paleta.inkSoft,
    flexWrap: "wrap",
    lineHeight: 20,
  },
});
