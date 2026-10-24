import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Fonts, Paleta } from "@/constants/theme";
import { PASOS_REPORTE } from "@/servicios/borrador";

const TITULOS = [
  "¿Qué problema viste?",
  "Sacá una foto",
  "¿Dónde está?",
  "Contanos qué pasa",
  "Confirmación",
];

type Props = {
  paso: number;
  onAtras: () => void;
  onCerrar: () => void;
  titulo?: string;
};

export function ProgresoReporte({ paso, onAtras, onCerrar, titulo }: Props) {
  return (
    <View style={styles.caja}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={onAtras}
          style={styles.boton}
        >
          <Ionicons name="arrow-back" size={22} color={Paleta.ink} />
        </Pressable>
        <Text style={styles.paso}>
          Paso {paso} de {PASOS_REPORTE}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={8}
          onPress={onCerrar}
          style={styles.boton}
        >
          <Ionicons name="close" size={22} color={Paleta.ink} />
        </Pressable>
      </View>
      <View style={styles.puntos}>
        {TITULOS.map((titulo, indice) => (
          <View
            key={titulo}
            style={[styles.punto, indice < paso ? styles.puntoActivo : null]}
          />
        ))}
      </View>
      <Text style={styles.titulo}>{titulo ?? TITULOS[paso - 1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    marginBottom: 8,
    gap: 16,
  },
  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  boton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  paso: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Paleta.inkSoft,
  },
  titulo: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: Paleta.ink,
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
