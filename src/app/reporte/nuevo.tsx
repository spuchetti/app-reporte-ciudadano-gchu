import { StyleSheet, View } from "react-native";

import { AsistenteReporte } from "@/components/reporte/asistente";
import { useTheme } from "@/hooks/use-theme";

export default function NuevoReporteScreen() {
  const tema = useTheme();

  return (
    <View style={[styles.contenedor, { backgroundColor: tema.background }]}>
      <AsistenteReporte />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
});