import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Paleta } from "@/constants/theme";
import { zonasMock } from "@/mocks/zonas";

type Props = {
  visible: boolean;
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onElegir: (zonaId: string) => void;
};

export function SheetZona({ visible, guardando, error, onCerrar, onElegir }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <Text style={styles.titulo}>Corregir zona</Text>
          <Text style={styles.subtitulo}>
            El reporte pasa a la zona que elijas.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {zonasMock.map((zona) => (
            <Pressable
              key={zona.id}
              accessibilityRole="button"
              accessibilityLabel={`Corregir a ${zona.nombre}`}
              disabled={guardando}
              onPress={() => onElegir(zona.id)}
              style={({ pressed }) => [styles.opcion, pressed && styles.opcionPressed]}
            >
              <Text style={styles.opcionNombre}>{zona.nombre}</Text>
            </Pressable>
          ))}

          {guardando ? (
            <ActivityIndicator color={Paleta.orange} style={styles.cargando} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              onPress={onCerrar}
              style={styles.cancelar}
            >
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(18,35,46,0.45)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: Paleta.paperRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: Paleta.ink,
  },
  subtitulo: {
    fontSize: 13,
    color: Paleta.inkSoft,
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    color: Paleta.rojo,
  },
  opcion: {
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Paleta.paper,
  },
  opcionPressed: {
    opacity: 0.85,
  },
  opcionNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.ink,
  },
  cargando: {
    marginTop: 12,
  },
  cancelar: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.inkSoft,
  },
});
