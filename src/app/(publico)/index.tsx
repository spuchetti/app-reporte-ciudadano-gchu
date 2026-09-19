import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { tiposReporteMock } from "@/mocks/reportes";
import { MENSAJE_SESION_VENCIDA } from "@/servicios/auth";
import { COORDENADAS_CENTRO, obtenerReportes } from "@/servicios/reportes";
import {
  COLORES_ESTADO,
  FILTROS_ESTADO_PUBLICO,
  etiquetaEstadoPublico,
  estadosDeFiltroPublico,
  filtrarReportesMapa,
  reportesDentroDeRadio,
  RADIO_CERCA_M,
  type FiltroEstadoPublico,
} from "@/servicios/mapa";
import { obtenerUbicacionActual } from "@/servicios/ubicacion";
import { Coordenadas, Reporte } from "@/tipos";

const REGION_GCHU = {
  latitude: COORDENADAS_CENTRO.latitud,
  longitude: COORDENADAS_CENTRO.longitud,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function MapaPublicoScreen() {
  const insets = useSafeAreaInsets();
  const {
    sesionVencida,
    huboVecino,
    cerrarAvisoSesionVencida,
    olvidarDispositivo,
  } = useSesion();
  const pedirIdentidad = sesionVencida || huboVecino;
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPublico | null>(null);
  const [soloCerca, setSoloCerca] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [origen, setOrigen] = useState<Coordenadas | null>(null);
  const [region, setRegion] = useState(REGION_GCHU);

  useEffect(() => {
    let activo = true;

    obtenerReportes()
      .then((lista) => {
        if (activo) {
          setReportes(lista);
        }
      })
      .catch(() => {
        // El mapa igual se muestra; los pines quedan vacíos.
      });

    obtenerUbicacionActual()
      .then((coords) => {
        if (!activo) {
          return;
        }
        setOrigen(coords);
        setRegion({
          latitude: coords.latitud,
          longitude: coords.longitud,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      })
      .catch(() => {
        // Sin GPS seguimos en el centro de la ciudad.
      });

    return () => {
      activo = false;
    };
  }, []);

  const visibles = useMemo(
    () =>
      filtrarReportesMapa({
        reportes,
        tipoId,
        estados: estadosDeFiltroPublico(filtroEstado),
        origen,
        soloCerca,
      }),
    [filtroEstado, origen, reportes, soloCerca, tipoId],
  );

  const cerca = origen
    ? reportesDentroDeRadio({
        reportes,
        origen,
        radioMetros: RADIO_CERCA_M,
      }).length
    : 0;

  const resumen = origen
    ? cerca === 0
      ? "No hay reportes cerca tuyo"
      : cerca === 1
        ? "Hay 1 reporte cerca tuyo"
        : `Hay ${cerca} reportes cerca tuyo`
    : "Mostramos los reportes de la ciudad";

  const filtrosActivos = [filtroEstado, soloCerca || null].filter(Boolean).length;

  return (
    <View style={styles.pantalla}>
      <StatusBar style="dark" />
      <View style={[styles.cabecera, { paddingTop: insets.top + 12 }]}>
        <View style={styles.cabeceraFila}>
          <View style={styles.cabeceraTexto}>
            <Text style={styles.titulo}>Mapa de Gualeguaychú</Text>
            <Text style={styles.subtitulo}>Podés mirar los reportes sin registrarte</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtros"
            onPress={() => setFiltrosAbiertos((abierto) => !abierto)}
            style={[styles.botonFiltro, filtrosActivos > 0 ? styles.botonFiltroActivo : null]}
          >
            <Text
              style={[
                styles.botonFiltroTexto,
                filtrosActivos > 0 ? styles.botonFiltroTextoActivo : null,
              ]}
            >
              {filtrosActivos > 0 ? `Filtros · ${filtrosActivos}` : "Filtros"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip etiqueta="Todos" activo={tipoId === null} onPress={() => setTipoId(null)} />
          {tiposReporteMock.map((tipo) => (
            <Chip
              key={tipo.id}
              etiqueta={tipo.nombre}
              activo={tipoId === tipo.id}
              onPress={() => setTipoId(tipo.id)}
            />
          ))}
        </ScrollView>
      </View>

      {sesionVencida ? (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>{MENSAJE_SESION_VENCIDA}</Text>
          <Pressable onPress={cerrarAvisoSesionVencida} accessibilityRole="button">
            <Text style={styles.avisoCerrar}>Cerrar</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.mapa} accessibilityLabel="Mapa de reportes">
        {Platform.OS === "web" ? (
          <Text style={styles.mapaWeb}>
            El mapa con las calles de Gualeguaychú se ve en el celular.
          </Text>
        ) : (
          <MapView
            key={origen ? `${origen.latitud}-${origen.longitud}` : "ciudad"}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            showsUserLocation
          >
            {visibles.map((reporte) => (
              <Marker
                key={reporte.id}
                coordinate={{
                  latitude: reporte.coordenadas.latitud,
                  longitude: reporte.coordenadas.longitud,
                }}
                pinColor={COLORES_ESTADO[reporte.estado]}
                title={`${etiquetaEstadoPublico(reporte.estado)} · ${reporte.codigo}`}
                description={reporte.direccion}
              />
            ))}
          </MapView>
        )}

        <View style={styles.resumen} accessibilityRole="text">
          <Text style={styles.resumenTexto}>{resumen}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: soloCerca }}
            accessibilityLabel="Cerca mío"
            onPress={() => setSoloCerca((valor) => !valor)}
            style={[styles.cercaChip, soloCerca ? styles.cercaChipActivo : null]}
          >
            <Text style={[styles.cercaTexto, soloCerca ? styles.cercaTextoActivo : null]}>
              Cerca mío
            </Text>
          </Pressable>
        </View>

        {filtrosAbiertos ? (
          <View style={styles.panelFiltros}>
            <Text style={styles.panelTitulo}>Estado</Text>
            <View style={styles.chipsWrap}>
              <Chip
                etiqueta="Todos"
                activo={filtroEstado === null}
                onPress={() => setFiltroEstado(null)}
              />
              {FILTROS_ESTADO_PUBLICO.map((item) => (
                <Chip
                  key={item.id}
                  etiqueta={item.etiqueta}
                  activo={filtroEstado === item.id}
                  onPress={() => setFiltroEstado(item.id)}
                />
              ))}
            </View>
            <View style={styles.leyenda}>
              <Leyenda color={COLORES_ESTADO.recibido} texto="Nuevo" />
              <Leyenda color={COLORES_ESTADO.en_revision} texto="En curso" />
              <Leyenda color={COLORES_ESTADO.resuelto} texto="Resuelto" />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Listo"
              onPress={() => setFiltrosAbiertos(false)}
              style={styles.listo}
            >
              <Text style={styles.listoTexto}>Listo</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[styles.pie, { paddingBottom: insets.bottom + 16 }]}>
        {pedirIdentidad ? (
          <>
            <Boton
              titulo="Identificarme"
              onPress={() => router.push("/register")}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void olvidarDispositivo();
              }}
              style={styles.noSoyYo}
            >
              <Text style={styles.noSoyYoTexto}>No soy yo</Text>
            </Pressable>
          </>
        ) : (
          <Boton
            titulo="Generar reporte"
            onPress={() => router.push("/reporte/nuevo")}
          />
        )}
        <Boton
          titulo="Acceso operador"
          variante="texto"
          onPress={() => router.push("/login")}
        />
      </View>
    </View>
  );
}

function Chip({
  etiqueta,
  activo,
  onPress,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[styles.chip, activo ? styles.chipActivo : null]}
    >
      <Text style={[styles.chipTexto, activo ? styles.chipTextoActivo : null]}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.leyendaPunto, { backgroundColor: color }]} />
      <Text style={styles.leyendaTexto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paperRaised,
  },
  cabecera: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Paleta.line,
    gap: 12,
  },
  cabeceraFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cabeceraTexto: {
    flex: 1,
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 20,
    fontWeight: "600",
    color: Paleta.ink,
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  botonFiltro: {
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 36,
    backgroundColor: Paleta.paper,
    borderWidth: 1,
    borderColor: Paleta.line,
    alignItems: "center",
    justifyContent: "center",
  },
  botonFiltroActivo: {
    backgroundColor: Paleta.teal,
    borderColor: Paleta.teal,
  },
  botonFiltroTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.ink,
  },
  botonFiltroTextoActivo: {
    color: Paleta.paperRaised,
  },
  chips: {
    gap: 8,
    paddingRight: 8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Paleta.paper,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  chipActivo: {
    backgroundColor: Paleta.teal,
    borderColor: Paleta.teal,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
  },
  chipTextoActivo: {
    color: Paleta.paperRaised,
  },
  aviso: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FDECEC",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13,
    color: Paleta.rojo,
    lineHeight: 18,
  },
  avisoCerrar: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
  },
  mapa: {
    flex: 1,
    backgroundColor: "#E1F5EE",
    overflow: "hidden",
  },
  mapaWeb: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    padding: 24,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  resumen: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#12232E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  resumenTexto: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
  },
  cercaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Paleta.paper,
  },
  cercaChipActivo: {
    backgroundColor: Paleta.teal,
  },
  cercaTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: Paleta.tealDeep,
  },
  cercaTextoActivo: {
    color: Paleta.paperRaised,
  },
  panelFiltros: {
    position: "absolute",
    top: 64,
    left: 16,
    right: 16,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#12232E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  panelTitulo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
  },
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leyendaPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leyendaTexto: {
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  listo: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  listoTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: Paleta.teal,
  },
  pie: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: Paleta.paperRaised,
  },
  noSoyYo: {
    alignItems: "center",
    paddingVertical: 12,
  },
  noSoyYoTexto: {
    fontSize: 14,
    color: Paleta.inkSoft,
  },
});
