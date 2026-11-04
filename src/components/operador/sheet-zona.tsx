import { ActivityIndicator, Modal, Pressable, StyleSheet, Text } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { zonasMock } from "@/mocks/zonas";

type Props = {
  visible: boolean;
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onElegir: (zonaId: string) => void;
};

export function SheetZona({ visible, guardando, error, onCerrar, onElegir }: Props) {
  const tema = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable
          style={[
            styles.panel,
            {
              backgroundColor: tema.surface,
              borderColor: tema.outline,
              borderTopWidth: tema.esOscuro ? 1 : 0,
            },
          ]}
          onPress={() => {}}
        >
          <Text style={[styles.titulo, { color: tema.onSurface }]}>Corregir zona</Text>
          <Text style={[styles.subtitulo, { color: tema.onSurfaceVariant }]}>
            El reporte pasa a la zona que elijas.
          </Text>

          {error ? <Text style={[styles.error, { color: tema.error }]}>{error}</Text> : null}

          {zonasMock.map((zona) => (
            <Pressable
              key={zona.id}
              accessibilityRole="button"
              accessibilityLabel={`Corregir a ${zona.nombre}`}
              disabled={guardando}
              onPress={() => onElegir(zona.id)}
              style={({ pressed }) => [
                styles.opcion,
                {
                  backgroundColor: tema.surfaceVariant,
                  borderColor: tema.outline,
                },
                pressed && styles.opcionPressed,
              ]}
            >
              <Text style={[styles.opcionNombre, { color: tema.onSurface }]}>{zona.nombre}</Text>
            </Pressable>
          ))}

          {guardando ? (
            <ActivityIndicator color={tema.secondary} style={styles.cargando} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              onPress={onCerrar}
              style={styles.cancelar}
            >
              <Text style={[styles.cancelarTexto, { color: tema.onSurfaceVariant }]}>
                Cancelar
              </Text>
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
    backgroundColor: "rgba(18,35,46,0.6)",
    justifyContent: "flex-end",
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 8,
  },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginBottom: 8,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  opcion: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  opcionPressed: {
    opacity: 0.85,
  },
  opcionNombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  cargando: {
    marginTop: 12,
  },
  cancelar: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelarTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
});