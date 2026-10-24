import { Pressable, StyleSheet, Text, View } from "react-native";

import { obtenerCategoriaVisual } from "@/constants/categorias";
import { fondoSuave, Fonts, Paleta } from "@/constants/theme";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { TipoDeReporte } from "@/tipos";

const DETALLE: Record<string, { nombre: string; detalle: string }> = {
  "tip-bache": { nombre: "Bache", detalle: "Pozos en la calle" },
  "tip-luminaria": { nombre: "Luminaria", detalle: "Luz apagada o rota" },
  "tip-basura": { nombre: "Basura", detalle: "Residuos acumulados" },
  "tip-rama": { nombre: "Rama o árbol", detalle: "Caídos o peligrosos" },
  "tip-agua": { nombre: "Agua o cloaca", detalle: "Pérdidas y desbordes" },
  "tip-semaforo": { nombre: "Semáforo", detalle: "No funciona o está dañado" },
  "tip-vereda": { nombre: "Vereda", detalle: "Rota o en mal estado" },
  "tip-otro": { nombre: "Otro", detalle: "No entra en las otras" },
};

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
        const texto = DETALLE[tipo.id];
        return (
          <Pressable
            key={tipo.id}
            accessibilityRole="button"
            accessibilityState={{ selected: seleccionado }}
            onPress={() => onElegir(tipo.id)}
            style={[styles.tarjeta, seleccionado ? styles.tarjetaActiva : null]}
          >
            <View
              style={[
                styles.icono,
                {
                  backgroundColor: fondoSuave(categoria?.color ?? Paleta.teal),
                },
              ]}
            >
              <IconoCategoria tipoId={tipo.id} size={22} />
            </View>
            <Text style={styles.nombre}>
              {texto?.nombre ?? categoria?.nombre ?? tipo.nombre}
            </Text>
            {texto?.detalle ? <Text style={styles.detalle}>{texto.detalle}</Text> : null}
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
    gap: 12,
  },
  tarjeta: {
    width: "47%",
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Paleta.line,
    backgroundColor: Paleta.paperRaised,
    alignItems: "flex-start",
    padding: 14,
    gap: 6,
  },
  tarjetaActiva: {
    borderWidth: 2,
    borderColor: Paleta.teal,
    backgroundColor: Paleta.tealSoft,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  nombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Paleta.ink,
  },
  detalle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Paleta.inkSoft,
  },
});
