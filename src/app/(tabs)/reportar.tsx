import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useOrigenReporte } from "@/contexto/origen-reporte";
import { useTheme } from "@/hooks/use-theme";

export default function ReportarVecinoScreen() {
  const { origen } = useOrigenReporte();
  const tema = useTheme();

  return (
    <View style={[styles.contenedor, { backgroundColor: tema.background }]}>
      <Redirect
        href={{
          pathname: "/reporte/nuevo",
          params: { origen },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
});