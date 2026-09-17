import { Redirect, router } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";

export default function MapaPublicoScreen() {
  const insets = useSafeAreaInsets();
  const { pendienteHuella } = useSesion();

  if (pendienteHuella) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.pantalla}>
      <StatusBar style="dark" />
      <View style={[styles.cabecera, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.titulo}>Mapa de Gualeguaychú</Text>
        <Text style={styles.subtitulo}>Podés mirar los reportes sin registrarte</Text>
      </View>
      <View style={styles.mapa}>
        <Text style={styles.mapaEmoji}>🗺️</Text>
        <Text style={styles.mapaTexto}>
          Para enviar un reporte dejá tu nombre, email y teléfono. Esa identidad
          queda en este dispositivo.
        </Text>
      </View>
      <View style={[styles.pie, { paddingBottom: insets.bottom + 16 }]}>
        <Boton
          titulo="Reportar un problema"
          onPress={() => router.push("/register")}
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
  mapa: {
    flex: 1,
    backgroundColor: "#E1F5EE",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  mapaEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapaTexto: {
    fontSize: 14,
    color: Paleta.inkSoft,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  pie: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  separador: {
    height: 8,
  },
});
