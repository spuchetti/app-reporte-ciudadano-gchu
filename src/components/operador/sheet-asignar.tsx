import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text } from "react-native";

import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { cuadrillasParaReporte, nombreZona } from "@/servicios/bandeja";
import { obtenerCuadrillas } from "@/servicios/zonas";
import { ZONA_FUERA } from "@/servicios/ubicacion";
import { Cuadrilla } from "@/tipos";

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
  const tema = useTheme();
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const fuera = zonaId === ZONA_FUERA;

  useEffect(() => {
    if (!visible || !zonaId) {
      setCuadrillas([]);
      setErrorCarga(null);
      return;
    }

    let activo = true;
    setCargando(true);
    setErrorCarga(null);

    obtenerCuadrillas()
      .then(() => {
        if (!activo) return;
        setCuadrillas(cuadrillasParaReporte(zonaId));
      })
      .catch(() => {
        if (!activo) return;
        setCuadrillas(cuadrillasParaReporte(zonaId));
        setErrorCarga("No pudimos actualizar las cuadrillas. Mostramos las que ya teníamos.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [visible, zonaId]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
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
          <Text style={[styles.titulo, { color: tema.onSurface }]}>Asignar cuadrilla</Text>
          <Text style={[styles.subtitulo, { color: tema.onSurfaceVariant }]}>
            {fuera
              ? "El reporte está fuera de zona. Al asignar, pasa a la zona de la cuadrilla."
              : "La cuadrilla queda a cargo de resolver el reporte."}
          </Text>

          {error || errorCarga ? (
            <Text style={[styles.error, { color: tema.error }]}>{error ?? errorCarga}</Text>
          ) : null}

          {cargando ? (
            <ActivityIndicator color={tema.secondary} style={styles.cargando} />
          ) : cuadrillas.length === 0 ? (
            <Text style={[styles.vacio, { color: tema.onSurfaceVariant }]}>
              No hay cuadrillas activas para esta zona.
            </Text>
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
                  {
                    backgroundColor: tema.surfaceVariant,
                    borderColor: tema.outline,
                  },
                  pressed && styles.opcionPressed,
                ]}
              >
                <Text style={[styles.opcionNombre, { color: tema.onSurface }]}>
                  {cuadrilla.nombre}
                </Text>
                <Text style={[styles.opcionMeta, { color: tema.onSurfaceVariant }]}>
                  {fuera
                    ? `${nombreZona(cuadrilla.zonaId)} · ${cuadrilla.especialidad}`
                    : cuadrilla.especialidad}
                </Text>
              </Pressable>
            ))
          )}

          {asignando ? (
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