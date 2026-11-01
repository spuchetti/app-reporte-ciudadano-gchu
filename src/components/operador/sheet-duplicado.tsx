import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Fonts, Paleta, PaletaOperador } from "@/constants/theme";
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <Text style={styles.titulo}>Marcar duplicado</Text>
          <Text style={styles.subtitulo}>
            Este reporte queda cerrado y apunta al original.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
            {opciones.length === 0 ? (
              <Text style={styles.vacio}>No hay otro reporte para marcarlo como duplicado.</Text>
            ) : (
              opciones.map((reporte) => (
                <Pressable
                  key={reporte.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Duplicado de ${reporte.codigo}`}
                  disabled={guardando}
                  onPress={() => onElegir(reporte.id)}
                  style={({ pressed }) => [styles.opcion, pressed && styles.opcionPressed]}
                >
                  <Text style={styles.opcionNombre}>{reporte.codigo}</Text>
                  <Text style={styles.opcionMeta}>
                    {`${nombreDe(reporte)} · ${reporte.direccion}`}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>

          {guardando ? (
            <ActivityIndicator color={PaletaOperador.principal} style={styles.cargando} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar duplicado"
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
    maxHeight: "88%",
  },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.ink,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
    marginBottom: 8,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.rojo,
  },
  lista: {
    flexGrow: 0,
  },
  vacio: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    paddingVertical: 12,
  },
  opcion: {
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Paleta.paper,
    marginBottom: 8,
  },
  opcionPressed: {
    opacity: 0.85,
  },
  opcionNombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.ink,
  },
  opcionMeta: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
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
    color: Paleta.inkSoft,
  },
});
