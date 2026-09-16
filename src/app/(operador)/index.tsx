import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";

export default function BandejaOperadorScreen() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />
      <View style={[styles.cabecera, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.titulo}>Bandeja del operador</Text>
        <Text style={styles.nombre}>{usuario?.nombre}</Text>
      </View>
      <View style={[styles.cuerpo, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.texto}>
          Acceso de operador. La bandeja de gestión se construye en un paso
          posterior.
        </Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        <Boton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
      </View>
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
  cuerpo: {
    padding: 16,
    gap: 16,
  },
  texto: {
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
  },
  email: {
    fontSize: 13,
    color: Paleta.ink,
  },
});
