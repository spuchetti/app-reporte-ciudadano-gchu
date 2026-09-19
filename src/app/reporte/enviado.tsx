import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TicketReporte } from "@/components/reporte/ticket";
import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";

function textoParam(valor: string | string[] | undefined) {
  if (Array.isArray(valor)) {
    return valor[0] ?? "";
  }
  return valor ?? "";
}

export default function ReporteEnviadoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    codigo?: string | string[];
    tipoNombre?: string | string[];
    area?: string | string[];
    direccion?: string | string[];
    modo?: string | string[];
    adhesiones?: string | string[];
  }>();

  const codigo = textoParam(params.codigo) || "GCHU-2026-00000";
  const tipoNombre = textoParam(params.tipoNombre) || "Reporte";
  const area = textoParam(params.area);
  const direccion = textoParam(params.direccion);
  const sumado = textoParam(params.modo) === "sumado";
  const adhesiones = textoParam(params.adhesiones);

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
      <Text style={styles.titulo}>
        {sumado ? "Te sumaste al reporte" : "Reporte enviado"}
      </Text>
      <Text style={styles.subtitulo}>
        {sumado
          ? adhesiones
            ? `Cuantos más vecinos se suman, más arriba va. Ya hay ${adhesiones} adhesiones.`
            : "Cuantos más vecinos se suman, más arriba va en la lista de Obras."
          : "Guardá este número de seguimiento. Con él vas a poder ver el estado."}
      </Text>
      <TicketReporte
        codigo={codigo}
        tipoNombre={tipoNombre}
        area={area}
        direccion={direccion}
      />
      <View style={styles.acciones}>
        <Boton titulo="Ir al inicio" onPress={() => router.replace("/(tabs)")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paper,
    paddingHorizontal: 24,
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
    marginBottom: 24,
  },
  acciones: {
    marginTop: 28,
  },
});
