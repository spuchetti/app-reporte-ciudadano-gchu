import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useDesbloqueoAlEntrar } from "@/components/ingreso/use-desbloqueo";
import { useSesion } from "@/contexto/sesion";
import { Rol } from "@/tipos";

type Props = {
  rol: Rol;
};

export function PantallaDesbloqueo({ rol }: Props) {
  const insets = useSafeAreaInsets();
  const { entrarConSesionGuardada } = useSesion();
  const desbloqueo = useDesbloqueoAlEntrar(rol, true);

  return (
    <View
      style={[
        styles.pantalla,
        {
          paddingTop: insets.top + 32,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <StatusBar style="dark" />
      <Text style={styles.titulo}>Confirmá que sos vos</Text>
      <Text style={styles.subtitulo}>
        Hay una sesión vigente en este teléfono. Usá tu rostro o el código para
        entrar.
      </Text>
      {desbloqueo.error ? (
        <Text style={styles.error}>{desbloqueo.error}</Text>
      ) : null}
      <Boton
        titulo="Reintentar"
        cargando={desbloqueo.desbloqueando}
        disabled={desbloqueo.desbloqueando}
        onPress={() => {
          void desbloqueo.reintentar();
        }}
      />
      <View style={styles.separador} />
      <Boton
        titulo="Usar mis datos"
        variante="texto"
        disabled={desbloqueo.desbloqueando}
        onPress={() => {
          void entrarConSesionGuardada(rol);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paperRaised,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 28,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
    marginBottom: 28,
  },
  error: {
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 16,
  },
  separador: {
    height: 8,
  },
});
