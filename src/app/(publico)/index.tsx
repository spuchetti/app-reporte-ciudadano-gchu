import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { MENSAJE_SESION_VENCIDA } from "@/servicios/auth";
import { COORDENADAS_CENTRO, obtenerReportes } from "@/servicios/reportes";
import { Reporte } from "@/tipos";

const REGION_GCHU = {
  latitude: COORDENADAS_CENTRO.latitud,
  longitude: COORDENADAS_CENTRO.longitud,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function MapaPublicoScreen() {
  const insets = useSafeAreaInsets();
  const {
    sesionVencida,
    huboVecino,
    cerrarAvisoSesionVencida,
    olvidarDispositivo,
  } = useSesion();
  const pedirIdentidad = sesionVencida || huboVecino;
  const [reportes, setReportes] = useState<Reporte[]>([]);

  useEffect(() => {
    let activo = true;

    obtenerReportes()
      .then((lista) => {
        if (activo) {
          setReportes(lista);
        }
      })
      .catch(() => {
        // El mapa igual se muestra; los pines quedan vacíos.
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <View style={styles.pantalla}>
      <StatusBar style="dark" />
      <View style={[styles.cabecera, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.titulo}>Mapa de Gualeguaychú</Text>
        <Text style={styles.subtitulo}>Podés mirar los reportes sin registrarte</Text>
      </View>

      {sesionVencida ? (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>{MENSAJE_SESION_VENCIDA}</Text>
          <Pressable onPress={cerrarAvisoSesionVencida} accessibilityRole="button">
            <Text style={styles.avisoCerrar}>Cerrar</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.mapa} accessibilityLabel="Mapa de reportes">
        {Platform.OS === "web" ? (
          <Text style={styles.mapaWeb}>
            El mapa con las calles de Gualeguaychú se ve en el celular.
          </Text>
        ) : (
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={REGION_GCHU}
            showsUserLocation={false}
          >
            {reportes.map((reporte) => (
              <Marker
                key={reporte.id}
                coordinate={{
                  latitude: reporte.coordenadas.latitud,
                  longitude: reporte.coordenadas.longitud,
                }}
                title={reporte.direccion}
                description={reporte.codigo}
              />
            ))}
          </MapView>
        )}
      </View>
      <View style={[styles.pie, { paddingBottom: insets.bottom + 16 }]}>
        {pedirIdentidad ? (
          <>
            <Boton
              titulo="Identificarme"
              onPress={() => router.push("/register")}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void olvidarDispositivo();
              }}
              style={styles.noSoyYo}
            >
              <Text style={styles.noSoyYoTexto}>No soy yo</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Boton
              titulo="Generar reporte"
              onPress={() => router.push("/reporte/nuevo")}
            />
            <View style={styles.separador} />
          </>
        )}
        <Boton
          titulo="Acceso operador"
          variante="texto"
          onPress={() => router.push("/login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paperRaised,
  },
  cabecera: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Paleta.line,
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 20,
    fontWeight: "600",
    color: Paleta.ink,
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  aviso: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FDECEC",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13,
    color: Paleta.rojo,
    lineHeight: 18,
  },
  avisoCerrar: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
  },
  mapa: {
    flex: 1,
    backgroundColor: "#E1F5EE",
    overflow: "hidden",
  },
  mapaWeb: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    padding: 24,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  pie: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  noSoyYo: {
    alignItems: "center",
    paddingVertical: 12,
  },
  noSoyYoTexto: {
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  separador: {
    height: 8,
  },
});
