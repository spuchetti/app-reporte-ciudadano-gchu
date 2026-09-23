import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";

import { MapView, Marker, Callout } from "@/components/mapa";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { tiposReporteMock } from "@/mocks/reportes";
import { zonasMock } from "@/mocks/zonas";
import {
  etiquetaEstado,
  obtenerAvisosDeEstado,
  obtenerReportesPorZona,
  resumenReportesCerca,
  ultimosReportesPublicos,
  type AvisoDeEstado,
} from "@/servicios/reportes";
import { EstadoReporte, Reporte } from "@/tipos";

const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: Paleta.amarillo,
  en_revision: Paleta.azul,
  asignado: Paleta.orange,
  resuelto: Paleta.verde,
  rechazado: Paleta.rojo,
};

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = `${partes[0]?.[0] ?? "V"}${partes[1]?.[0] ?? ""}`;
  return letras.toUpperCase();
}

function colorEstado(estado: string) {
  return COLORES_ESTADO[estado as EstadoReporte] ?? Paleta.inkSoft;
}

export default function HomeVecinoScreen() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
  const router = useRouter();
  const zonaId = usuario?.zonaId ?? null;
  const autorId = usuario?.id ?? null;
  const zonaNombre =
    zonasMock.find((zona) => zona.id === zonaId)?.nombre ?? "Tu zona";

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [avisos, setAvisos] = useState<AvisoDeEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [region] = useState({
    latitude: -33.0094,
    longitude: -58.5145,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      (async () => {
        if (!zonaId) {
          if (activo) {
            setReportes([]);
            setAvisos([]);
            setError(null);
            setCargando(false);
          }
          return;
        }

        setCargando(true);
        setError(null);
        try {
          const [lista, cambios] = await Promise.all([
            obtenerReportesPorZona(zonaId),
            autorId ? obtenerAvisosDeEstado(autorId) : Promise.resolve([]),
          ]);
          if (activo) {
            setReportes(lista);
            setAvisos(cambios);
          }
        } catch {
          if (activo) {
            setError("No se pudieron cargar los reportes de tu zona.");
            setReportes([]);
            setAvisos([]);
          }
        } finally {
          if (activo) {
            setCargando(false);
          }
        }
      })();

      return () => {
        activo = false;
      };
    }, [autorId, zonaId]),
  );

  const ultimos = useMemo(
    () => ultimosReportesPublicos(reportes, 3),
    [reportes],
  );

  const resumen = !zonaId
    ? "Todavía no tenés una zona asignada."
    : error
      ? error
      : cargando
        ? "Cargando reportes de tu zona…"
        : resumenReportesCerca(reportes.length);

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />

      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === "web" ? 88 : insets.top + 16 },
        ]}
      >
        <View style={styles.cabeceraIzquierda}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>
              {iniciales(usuario?.nombre ?? "Vecino")}
            </Text>
          </View>
          <View style={styles.saludoBloque}>
            <Text style={styles.saludo}>Hola</Text>
            <Text style={styles.nombre} numberOfLines={1}>
              {usuario?.nombre ?? "Vecino"}
            </Text>
            <Text style={styles.zona} numberOfLines={1}>
              {zonaNombre}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={cerrarSesion}
          hitSlop={8}
        >
          <Text style={styles.salir}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <View style={styles.mapaContainer} accessibilityLabel="Mapa de reportes">
        <MapView style={styles.mapa} initialRegion={region}>
          {reportes.map((reporte) => {
            const tipo = tiposReporteMock.find((t) => t.id === reporte.tipoId);
            const pin = colorEstado(reporte.estado);
            const fotoPrincipal = reporte.fotos.find((f) => f.esPrincipal)?.url;

            return (
              <Marker
                key={reporte.id}
                coordinate={{
                  latitude: reporte.coordenadas.latitud,
                  longitude: reporte.coordenadas.longitud,
                }}
                pinColor={pin}
              >
                <Callout>
                  <View style={styles.burbujaInfo}>
                    {fotoPrincipal ? (
                      <Image
                        source={{ uri: fotoPrincipal }}
                        style={styles.miniatura}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text style={styles.tituloBurbuja}>
                      {`${tipo?.icono || "📌"} ${tipo?.nombre || "Reporte"}`}
                    </Text>
                    <Text style={styles.textoBurbuja} numberOfLines={3}>
                      {reporte.descripcion || reporte.direccion}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        <View
          style={[
            styles.resumen,
            error ? styles.resumenError : null,
          ]}
          accessibilityRole="text"
        >
          <Text style={[styles.resumenTexto, error ? styles.resumenErrorTexto : null]}>
            {resumen}
          </Text>
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.manija} />

        <ScrollView
          style={styles.panelLista}
          contentContainerStyle={styles.panelListaContenido}
          showsVerticalScrollIndicator={false}
        >
          {avisos.length > 0 ? (
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>Tus reportes</Text>
              {avisos.map((aviso) => (
                <View key={aviso.id} style={styles.avisoFila}>
                  <View
                    style={[
                      styles.avisoMarca,
                      { backgroundColor: colorEstado(aviso.estado) },
                    ]}
                  />
                  <View style={styles.filaTexto}>
                    <Text style={styles.filaTitulo} numberOfLines={1}>
                      {`Tu reporte de ${aviso.tipoNombre} está ${etiquetaEstado(aviso.estado)}.`}
                    </Text>
                    {aviso.comentario ? (
                      <Text style={styles.filaMeta} numberOfLines={1}>
                        {aviso.comentario}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {ultimos.length > 0 ? (
            <View style={styles.bloque}>
              <Text style={styles.bloqueTitulo}>Últimos de tu zona</Text>
              {ultimos.map((reporte) => {
                const tipo = tiposReporteMock.find((t) => t.id === reporte.tipoId);
                const estado = colorEstado(reporte.estado);
                return (
                  <View key={reporte.id} style={styles.reporteFila}>
                    <View style={styles.reporteIcono}>
                      <Text style={styles.reporteIconoTexto}>
                        {tipo?.icono ?? "📌"}
                      </Text>
                    </View>
                    <View style={styles.filaTexto}>
                      <Text style={styles.filaTitulo} numberOfLines={1}>
                        {tipo?.nombre ?? "Reporte"}
                      </Text>
                      <Text style={styles.filaMeta} numberOfLines={1}>
                        {reporte.descripcion || reporte.direccion}
                      </Text>
                    </View>
                    <View style={[styles.insignia, { backgroundColor: `${estado}22` }]}>
                      <Text style={[styles.insigniaTexto, { color: estado }]}>
                        {etiquetaEstado(reporte.estado)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reportar problema"
          onPress={() => router.push("/reporte/nuevo")}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaTexto}>Reportar problema</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Paleta.paper },
  cabecera: {
    backgroundColor: Paleta.teal,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cabeceraIzquierda: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saludoBloque: {
    flex: 1,
  },
  saludo: { fontSize: 12, color: "rgba(255,255,255,0.78)" },
  nombre: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 20,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  zona: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
  },
  salir: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  avatar: {
    width: 44,
    height: 44,
    backgroundColor: Paleta.tealDeep,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: Paleta.paperRaised,
  },
  mapaContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E1F5EE",
    overflow: "hidden",
  },
  mapa: { width: "100%", height: "100%" },
  resumen: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#12232E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  resumenError: {
    backgroundColor: "#FDECEC",
  },
  resumenTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.ink,
  },
  resumenErrorTexto: {
    color: Paleta.rojo,
  },
  panel: {
    backgroundColor: Paleta.paperRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
    shadowColor: "#12232E",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  manija: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Paleta.line,
    marginBottom: 4,
  },
  panelLista: {
    maxHeight: 200,
  },
  panelListaContenido: {
    gap: 16,
    paddingBottom: 4,
  },
  bloque: {
    gap: 8,
  },
  bloqueTitulo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
  },
  avisoFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Paleta.paper,
    borderRadius: 10,
    paddingVertical: 10,
    paddingRight: 12,
    overflow: "hidden",
  },
  avisoMarca: {
    width: 4,
    alignSelf: "stretch",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  reporteFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reporteIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Paleta.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  reporteIconoTexto: {
    fontSize: 16,
  },
  filaTexto: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  filaTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.ink,
  },
  filaMeta: {
    fontSize: 12,
    color: Paleta.inkSoft,
    lineHeight: 16,
  },
  insignia: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  insigniaTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  cta: {
    backgroundColor: Paleta.orange,
    minHeight: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaTexto: {
    color: Paleta.paperRaised,
    fontSize: 16,
    fontWeight: "700",
  },
  burbujaInfo: {
    width: 250,
    padding: 8,
  },
  miniatura: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  tituloBurbuja: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: Paleta.ink,
  },
  textoBurbuja: {
    fontSize: 14,
    color: Paleta.inkSoft,
    flexWrap: "wrap",
    lineHeight: 20,
  },
});
