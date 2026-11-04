import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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
  const tema = useTheme();

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
          <Ionicons name="arrow-back" size={22} color={tema.onSurface} />
        </Pressable>
        <Text style={[styles.paso, { color: tema.onSurfaceVariant }]}>
          Paso {paso} de {PASOS_REPORTE}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={8}
          onPress={onCerrar}
          style={styles.boton}
        >
          <Ionicons name="close" size={22} color={tema.onSurface} />
        </Pressable>
      </View>
      <View style={styles.puntos}>
        {TITULOS.map((itemTitulo, indice) => (
          <View
            key={itemTitulo}
            style={[
              styles.punto,
              { backgroundColor: tema.outline },
              indice < paso && { backgroundColor: tema.primary },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.titulo, { color: tema.onSurface }]}>
        {titulo ?? TITULOS[paso - 1]}
      </Text>
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
  },
  titulo: {
    fontFamily: Fonts.bold,
    fontSize: 26,
  },
  puntos: {
    flexDirection: "row",
    gap: 6,
  },
  punto: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});