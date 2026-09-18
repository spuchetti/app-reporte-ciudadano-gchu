import { Pressable, StyleSheet, Text, View } from "react-native";

import { Paleta } from "@/constants/theme";
import { TipoDeReporte } from "@/tipos";

type Props = {
  tipos: TipoDeReporte[];
  tipoId: string;
  onElegir: (id: string) => void;
};

export function PasoTipo({ tipos, tipoId, onElegir }: Props) {
  return (
    <View style={styles.grilla}>
      {tipos.map((tipo) => {
        const seleccionado = tipo.id === tipoId;
        return (
          <Pressable
            key={tipo.id}
            accessibilityRole="button"
            accessibilityState={{ selected: seleccionado }}
            onPress={() => onElegir(tipo.id)}
            style={[styles.tarjeta, seleccionado ? styles.tarjetaActiva : null]}
          >
            <Text style={styles.icono}>{tipo.icono}</Text>
            <Text
              style={[styles.nombre, seleccionado ? styles.nombreActivo : null]}
            >
              {tipo.nombre}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tarjeta: {
    width: "47%",
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Paleta.line,
    backgroundColor: Paleta.paper,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  tarjetaActiva: {
    borderColor: Paleta.teal,
    backgroundColor: "#E1F5EE",
  },
  icono: {
    fontSize: 28,
  },
  nombre: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
    textAlign: "center",
  },
  nombreActivo: {
    color: Paleta.tealDeep,
  },
});
