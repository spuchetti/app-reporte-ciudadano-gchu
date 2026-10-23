import { Pressable, StyleSheet, Text, View } from "react-native";

import { obtenerCategoriaVisual } from "@/constants/categorias";
import { Fonts, Paleta } from "@/constants/theme";
import { IconoCategoria } from "@/components/ui/icono-categoria";
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
        const categoria = obtenerCategoriaVisual(tipo.id);
        return (
          <Pressable
            key={tipo.id}
            accessibilityRole="button"
            accessibilityState={{ selected: seleccionado }}
            onPress={() => onElegir(tipo.id)}
            style={[styles.tarjeta, seleccionado ? styles.tarjetaActiva : null]}
          >
            <IconoCategoria tipoId={tipo.id} size={28} />
            <Text
              style={[styles.nombre, seleccionado ? styles.nombreActivo : null]}
            >
              {categoria?.nombre ?? tipo.nombre}
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
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Paleta.line,
    backgroundColor: Paleta.paperRaised,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  tarjetaActiva: {
    borderColor: Paleta.teal,
    backgroundColor: Paleta.tealSoft,
  },
  nombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.ink,
    textAlign: "center",
  },
  nombreActivo: {
    fontFamily: Fonts.bold,
    color: Paleta.tealDeep,
  },
});
