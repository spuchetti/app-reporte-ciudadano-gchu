import React, { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import MapView, { Marker, Callout } from "react-native-maps";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { tiposReporteMock } from "@/mocks/reportes";
import { obtenerReportesPorZona } from "@/servicios/reportes";
import { Reporte } from "@/tipos";

const coloresEstado: Record<string, string> = {
  recibido: "#F2B705",
  en_revision: "#2E6E9E",
  asignado: "#E8630C",
  resuelto: "#2F9E52",
  rechazado: "#D64545",
};

export default function HomeVecinoScreen() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
  const router = useRouter();
  const zonaId = usuario?.zonaId ?? null;

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [region] = useState({
    latitude: -33.0094,
    longitude: -58.5145,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      (async () => {
        if (!zonaId) {
          if (activo) {
            setReportes([]);
            setError(null);
            setCargando(false);
          }
          return;
        }

        setCargando(true);
        setError(null);
        try {
          const lista = await obtenerReportesPorZona(zonaId);
          if (activo) {
            setReportes(lista);
          }
        } catch {
          if (activo) {
            setError("No se pudieron cargar los reportes de tu zona.");
            setReportes([]);
          }
        } finally {
          if (activo) {
            setCargando(false);
          }
        }
      })();

      return () => {
        activo = false;
      };
    }, [zonaId]),
  );

  const aviso = !zonaId
    ? "Todavía no tenés una zona asignada."
    : error
      ? error
      : cargando
        ? "Cargando reportes de tu zona…"
        : reportes.length === 0
          ? "No hay reportes en tu zona."
          : null;

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
          {reportes.map((reporte) => {
            const tipo = tiposReporteMock.find((t) => t.id === reporte.tipoId);
            const colorPin = coloresEstado[reporte.estado] || Paleta.orange;
            const fotoPrincipal = reporte.fotos.find((f) => f.esPrincipal)?.url;

            return (
              <Marker
                key={reporte.id}
                coordinate={{
                  latitude: reporte.coordenadas.latitud,
                  longitude: reporte.coordenadas.longitud,
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

        {aviso ? (
          <View style={styles.aviso} accessibilityRole="text">
            <Text style={styles.avisoTexto}>{aviso}</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Generar reporte"
          onPress={() => router.push("/reporte/nuevo")}
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
    width: 40,
    height: 40,
    backgroundColor: Paleta.orange,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { fontSize: 20 },
  mapaContainer: { flex: 1, position: "relative" },
  mapa: { width: "100%", height: "100%" },
  aviso: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 92,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  avisoTexto: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  fab: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: Paleta.orange,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
