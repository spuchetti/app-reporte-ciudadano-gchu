import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { TicketReporte } from "@/components/reporte/ticket";
import { Boton } from "@/components/ui/boton";
import { Fonts, Paleta } from "@/constants/theme";

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
    estado?: string | string[];
    modo?: string | string[];
    adhesiones?: string | string[];
    tipoId?: string | string[];
    estadoClave?: string | string[];
    pendiente?: string | string[];
  }>();

  const codigo = textoParam(params.codigo) || "GCHU-2026-00000";
  const tipoNombre = textoParam(params.tipoNombre) || "Reporte";
  const area = textoParam(params.area);
  const direccion = textoParam(params.direccion);
  const estado = textoParam(params.estado);
  const tipoId = textoParam(params.tipoId);
  const estadoClave = textoParam(params.estadoClave);
  const provisorio = codigo.startsWith("LOCAL-");
  const pendiente = textoParam(params.pendiente) === "1" || provisorio;
  const sumado = textoParam(params.modo) === "sumado";
  const adhesiones = textoParam(params.adhesiones);
  const titulo = sumado ? "Te sumaste al reporte" : "Reporte enviado";

  return (
    <View
      style={[
        styles.pantalla,
        {
          paddingTop: insets.top + 28,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <StatusBar style="dark" />
      <View style={styles.tituloFila}>
        <View style={styles.iconoTitulo}>
          <Ionicons name="document-text-outline" size={24} color={Paleta.tealDeep} />
          <View style={styles.tilde}>
            <Ionicons name="checkmark" size={11} color={Paleta.paperRaised} />
          </View>
        </View>
        <Text style={styles.titulo}>{titulo}</Text>
      </View>
      <Text style={styles.subtitulo}>
        {sumado
          ? adhesiones
            ? `Cuantos más vecinos se suman, más arriba va. Ya hay ${adhesiones} adhesiones.`
            : "Cuantos más vecinos se suman, más arriba va en la lista de Obras."
          : provisorio
            ? "Este número es del dispositivo. Cuando haya señal, lo reemplazamos por el código del municipio."
            : "Guardá este número de seguimiento. Con él vas a poder ver el estado."}
      </Text>
      <TicketReporte
        codigo={codigo}
        tipoId={tipoId || undefined}
        tipoNombre={tipoNombre}
        area={area}
        direccion={direccion}
        estado={estado || undefined}
        estadoClave={
          estadoClave === "recibido" ||
          estadoClave === "en_revision" ||
          estadoClave === "asignado" ||
          estadoClave === "resuelto" ||
          estadoClave === "rechazado"
            ? estadoClave
            : undefined
        }
        pendiente={pendiente}
      />
      <View style={styles.acciones}>
        <Boton
          titulo="Ir al inicio"
          variante="secundario"
          onPress={() => router.replace("/(tabs)")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paperRaised,
    paddingHorizontal: 24,
  },
  tituloFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconoTitulo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Paleta.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tilde: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Paleta.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Paleta.ink,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
    marginBottom: 24,
  },
  acciones: {
    marginTop: 24,
  },
});
