import { useCallback, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { SheetAsignar } from "@/components/operador/sheet-asignar";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import {
  haceTiempo,
  nombreAutor,
  nombreTipo,
  nombreZona,
  puedeAsignar,
  textoFotos,
} from "@/servicios/bandeja";
import { esErrorServicio } from "@/servicios/error";
import {
  asignarCuadrilla,
  etiquetaEstado,
  obtenerCambiosEstado,
  obtenerReportePorId,
} from "@/servicios/reportes";
import { CambioDeEstado, EstadoReporte, Reporte } from "@/tipos";

const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: Paleta.amarillo,
  en_revision: Paleta.azul,
  asignado: Paleta.orange,
  resuelto: Paleta.verde,
  rechazado: Paleta.rojo,
};

export default function DetalleOperadorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cambios, setCambios] = useState<CambioDeEstado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!id) {
      setError("No encontramos ese reporte.");
      return;
    }
    try {
      const [item, historial] = await Promise.all([
        obtenerReportePorId(id),
        obtenerCambiosEstado(id),
      ]);
      if (!item) {
        setError("No encontramos ese reporte.");
        setReporte(null);
        return;
      }
      setReporte(item);
      setCambios(
        [...historial].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
      );
      setError(null);
    } catch {
      setError("No se pudo cargar el reporte.");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function onAsignar(cuadrillaId: string) {
    if (!reporte || !usuario) {
      return;
    }
    setAsignando(true);
    setErrorAsignar(null);
    try {
      const actualizado = await asignarCuadrilla(
        reporte.id,
        cuadrillaId,
        usuario.id,
      );
      setReporte(actualizado);
      setMostrarAsignar(false);
      await cargar();
    } catch (err) {
      setErrorAsignar(
        esErrorServicio(err) ? err.message : "No se pudo asignar el reporte.",
      );
    } finally {
      setAsignando(false);
    }
  }

  const color = reporte ? COLORES_ESTADO[reporte.estado] : Paleta.inkSoft;
  const foto = reporte?.fotos.find((item) => item.esPrincipal)?.url;

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />
      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === "web" ? 48 : insets.top + 16 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bandeja"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Text style={styles.volver}>Bandeja</Text>
        </Pressable>
        <Text style={styles.titulo} numberOfLines={1}>
          {reporte?.codigo ?? "Reporte"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {error || !reporte ? (
          <Text style={styles.vacio}>{error ?? "Cargando…"}</Text>
        ) : (
          <>
            <View style={[styles.insignia, { backgroundColor: `${color}22` }]}>
              <Text style={[styles.insigniaTexto, { color }]}>
                {etiquetaEstado(reporte.estado)}
              </Text>
            </View>

            {foto ? (
              <Image source={{ uri: foto }} style={styles.foto} />
            ) : null}

            <Text style={styles.tipo}>
              {`${nombreTipo(reporte.tipoId)} · ${reporte.direccion}`}
            </Text>
            <Text style={styles.meta}>
              {`${nombreZona(reporte.zonaId)} · ${haceTiempo(reporte.creadoEn)}`}
            </Text>
            <Text style={styles.meta}>
              {`${nombreAutor(reporte.autorId)} · ${textoFotos(reporte.fotos.length)}`}
            </Text>

            {reporte.descripcion ? (
              <Text style={styles.descripcion}>{reporte.descripcion}</Text>
            ) : null}

            {puedeAsignar(reporte.estado) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Asignar ${reporte.codigo}`}
                onPress={() => {
                  setErrorAsignar(null);
                  setMostrarAsignar(true);
                }}
                style={({ pressed }) => [
                  styles.botonAsignar,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.botonAsignarTexto}>Asignar</Text>
              </Pressable>
            ) : null}

            {cambios.length > 0 ? (
              <View style={styles.historial}>
                <Text style={styles.historialTitulo}>Historial</Text>
                {cambios.map((cambio) => (
                  <View key={cambio.id} style={styles.cambio}>
                    <Text style={styles.cambioEstado}>
                      {etiquetaEstado(cambio.estado)}
                    </Text>
                    {cambio.comentario ? (
                      <Text style={styles.cambioTexto}>{cambio.comentario}</Text>
                    ) : null}
                    <Text style={styles.cambioFecha}>
                      {haceTiempo(cambio.fechaHora)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <SheetAsignar
        visible={mostrarAsignar}
        zonaId={reporte?.zonaId ?? null}
        asignando={asignando}
        error={errorAsignar}
        onCerrar={() => {
          if (!asignando) {
            setMostrarAsignar(false);
          }
        }}
        onElegir={onAsignar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Paleta.paper },
  cabecera: {
    backgroundColor: Paleta.orange,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  volver: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 22,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  contenido: {
    padding: 16,
    gap: 10,
  },
  vacio: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  insignia: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  insigniaTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
  foto: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: Paleta.paperRaised,
  },
  tipo: {
    fontSize: 16,
    fontWeight: "600",
    color: Paleta.ink,
  },
  meta: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  descripcion: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Paleta.ink,
  },
  botonAsignar: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Paleta.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  botonAsignarTexto: {
    color: Paleta.paperRaised,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
  },
  historial: {
    marginTop: 12,
    gap: 8,
  },
  historialTitulo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
  },
  cambio: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Paleta.line,
    gap: 4,
  },
  cambioEstado: {
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.ink,
  },
  cambioTexto: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  cambioFecha: {
    fontSize: 12,
    color: Paleta.inkSoft,
  },
});
