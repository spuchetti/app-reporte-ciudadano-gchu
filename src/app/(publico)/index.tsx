import { router } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { MENSAJE_SESION_VENCIDA } from "@/servicios/auth";

export default function MapaPublicoScreen() {
  const insets = useSafeAreaInsets();
  const { sesionVencida, cerrarAvisoSesionVencida } = useSesion();

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
        <Text style={styles.mapaEmoji}>🗺️</Text>
      </View>
      <View style={[styles.pie, { paddingBottom: insets.bottom + 16 }]}>
        <Boton
          titulo="Generar reporte"
          onPress={() => router.push("/reporte")}
        />
        <View style={styles.separador} />
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
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  mapaEmoji: {
    fontSize: 48,
  },
  pie: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  separador: {
    height: 8,
  },
});
