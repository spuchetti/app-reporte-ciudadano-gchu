import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";

export default function HomeVecinoScreen() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

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

      <View style={[styles.cuerpo, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.texto}>
          Sesión iniciada como vecino. El home con reportes de la zona se arma en
          el siguiente paso.
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
    backgroundColor: Paleta.teal,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saludo: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
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
  avatarTexto: {
    fontSize: 20,
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
