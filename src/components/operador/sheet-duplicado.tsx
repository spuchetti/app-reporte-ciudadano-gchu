import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Reporte } from "@/tipos";

type Props = {
  visible: boolean;
  opciones: Reporte[];
  nombreDe: (reporte: Reporte) => string;
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onElegir: (reporteId: string) => void;
};

export function SheetDuplicado({
  visible,
  opciones,
  nombreDe,
  guardando,
  error,
  onCerrar,
  onElegir,
}: Props) {
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
          <Text style={[styles.titulo, { color: tema.onSurface }]}>Marcar duplicado</Text>
          <Text style={[styles.subtitulo, { color: tema.onSurfaceVariant }]}>
            Este reporte queda cerrado y apunta al original.
          </Text>

          {error ? <Text style={[styles.error, { color: tema.error }]}>{error}</Text> : null}

          <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
            {opciones.length === 0 ? (
              <Text style={[styles.vacio, { color: tema.onSurfaceVariant }]}>
                No hay otro reporte para marcarlo como duplicado.
              </Text>
            ) : (
              opciones.map((reporte) => (
                <Pressable
                  key={reporte.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Duplicado de ${reporte.codigo}`}
                  disabled={guardando}
                  onPress={() => onElegir(reporte.id)}
                  style={({ pressed }) => [
                    styles.opcion,
                    {
                      backgroundColor: tema.surfaceVariant,
                      borderColor: tema.outline,
                    },
                    pressed && styles.opcionPressed,
                  ]}
                >
                  <Text style={[styles.opcionNombre, { color: tema.onSurface }]}>
                    {reporte.codigo}
                  </Text>
                  <Text style={[styles.opcionMeta, { color: tema.onSurfaceVariant }]}>
                    {`${nombreDe(reporte)} · ${reporte.direccion}`}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>

          {guardando ? (
            <ActivityIndicator color={tema.secondary} style={styles.cargando} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar duplicado"
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
    maxHeight: "88%",
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
  lista: {
    flexGrow: 0,
  },
  vacio: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    paddingVertical: 12,
  },
  opcion: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  opcionPressed: {
    opacity: 0.85,
  },
  opcionNombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  opcionMeta: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 12,
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