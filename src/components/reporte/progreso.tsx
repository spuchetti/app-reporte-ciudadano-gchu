import { Platform, StyleSheet, Text, View } from "react-native";

import { Paleta } from "@/constants/theme";
import { PASOS_REPORTE } from "@/servicios/borrador";

const TITULOS = [
  "Tipo de problema",
  "Foto",
  "Ubicación",
  "Descripción",
  "Confirmación",
];

type Props = {
  paso: number;
};

export function ProgresoReporte({ paso }: Props) {
  return (
    <View style={styles.caja}>
      <Text style={styles.kicker}>
        Paso {paso} de {PASOS_REPORTE}
      </Text>
      <Text style={styles.titulo}>{TITULOS[paso - 1]}</Text>
      <View style={styles.puntos}>
        {TITULOS.map((_, indice) => (
          <View
            key={TITULOS[indice]}
            style={[
              styles.punto,
              indice < paso ? styles.puntoActivo : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    marginBottom: 20,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
    color: Paleta.teal,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 24,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 12,
  },
  puntos: {
    flexDirection: "row",
    gap: 6,
  },
  punto: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Paleta.line,
  },
  puntoActivo: {
    backgroundColor: Paleta.teal,
  },
});
