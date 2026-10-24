import { ActivityIndicator, Modal, Pressable, StyleSheet, Text } from "react-native";

import { Fonts, Paleta, PaletaOperador } from "@/constants/theme";
import { cuadrillasParaReporte, nombreZona } from "@/servicios/bandeja";
import { ZONA_FUERA } from "@/servicios/ubicacion";

type Props = {
  visible: boolean;
  zonaId: string | null;
  asignando: boolean;
  error: string | null;
  onCerrar: () => void;
  onElegir: (cuadrillaId: string) => void;
};

export function SheetAsignar({
  visible,
  zonaId,
  asignando,
  error,
  onCerrar,
  onElegir,
}: Props) {
  const cuadrillas = zonaId ? cuadrillasParaReporte(zonaId) : [];
  const fuera = zonaId === ZONA_FUERA;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <Text style={styles.titulo}>Asignar cuadrilla</Text>
          <Text style={styles.subtitulo}>
            {fuera
              ? "El reporte está fuera de zona. Al asignar, pasa a la zona de la cuadrilla."
              : "La cuadrilla queda a cargo de resolver el reporte."}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {cuadrillas.length === 0 ? (
            <Text style={styles.vacio}>No hay cuadrillas activas para esta zona.</Text>
          ) : (
            cuadrillas.map((cuadrilla) => (
              <Pressable
                key={cuadrilla.id}
                accessibilityRole="button"
                accessibilityLabel={`Asignar a ${cuadrilla.nombre}`}
                disabled={asignando}
                onPress={() => onElegir(cuadrilla.id)}
                style={({ pressed }) => [
                  styles.opcion,
                  pressed && styles.opcionPressed,
                ]}
              >
                <Text style={styles.opcionNombre}>{cuadrilla.nombre}</Text>
                <Text style={styles.opcionMeta}>
                  {fuera
                    ? `${nombreZona(cuadrilla.zonaId)} · ${cuadrilla.especialidad}`
                    : cuadrilla.especialidad}
                </Text>
              </Pressable>
            ))
          )}

          {asignando ? (
            <ActivityIndicator color={PaletaOperador.principal} style={styles.cargando} />
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
