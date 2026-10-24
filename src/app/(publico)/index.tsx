import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import IconoPrincipal from "@/assets/branding/icono_principal.svg";
import { MapView, Marker } from "@/components/mapa";
import { Boton } from "@/components/ui/boton";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { Fonts, Paleta } from "@/constants/theme";
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
  const [ubicando, setUbicando] = useState(false);
  const [altoPie, setAltoPie] = useState(220);
  const mapaRef = useRef<ComponentRef<typeof MapView>>(null);

  function centrarEn(coords: Coordenadas) {
    const siguiente = {
      latitude: coords.latitud,
      longitude: coords.longitud,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setOrigen(coords);
    setRegion(siguiente);
    const mapa = mapaRef.current as { animateToRegion?: (region: typeof siguiente, ms: number) => void } | null;
    mapa?.animateToRegion?.(siguiente, 450);
  }

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
        centrarEn(coords);
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

  const filtrosActivos = [filtroEstado, soloCerca || null].filter(Boolean).length;

  return (
    <View style={styles.pantalla}>
      <StatusBar style="dark" />
      <View style={styles.mapa} accessibilityLabel="Mapa de reportes">
        <MapView
          ref={mapaRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsMyLocationButton={false}
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
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mi ubicación"
        disabled={ubicando}
        collapsable={false}
        onPress={() => {
          setUbicando(true);
          obtenerUbicacionActual()
            .then((coords) => centrarEn(coords))
            .catch(() => {
              // Sin permiso el mapa se queda donde está.
            })
            .finally(() => setUbicando(false));
        }}
        style={[styles.ubicar, { bottom: altoPie + 16 }]}
      >
        <View style={styles.ubicarCirculo} collapsable={false}>
          {ubicando ? (
            <ActivityIndicator color={Paleta.tealDeep} />
          ) : (
            <Ionicons name="locate" size={22} color={Paleta.tealDeep} />
          )}
        </View>
      </Pressable>

      <View
        pointerEvents="box-none"
        style={[styles.cabecera, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.tarjetaCabecera}>
          <IconoPrincipal
            width={40}
            height={40}
            accessibilityLabel="Reporte Ciudadano"
          />
          <View style={styles.titulos}>
            <Text style={styles.titulo} numberOfLines={1}>
              Gualeguaychú
            </Text>
            <Text style={styles.subtitulo} numberOfLines={1}>
              Mirá los reportes de tu ciudad
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtros"
            accessibilityState={{ selected: filtrosAbiertos || filtrosActivos > 0 }}
            onPress={() => setFiltrosAbiertos((abierto) => !abierto)}
            hitSlop={8}
            style={[
              styles.botonFiltro,
              filtrosActivos > 0 ? styles.botonFiltroActivo : null,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filtrosActivos > 0 ? Paleta.paperRaised : Paleta.tealDeep}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            etiqueta="Todos"
            iconoApp
            activo={tipoId === null}
            onPress={() => setTipoId(null)}
          />
          {tiposReporteMock.map((tipo) => (
            <Chip
              key={tipo.id}
              etiqueta={tipo.nombre}
              tipoId={tipo.id}
              activo={tipoId === tipo.id}
              onPress={() => setTipoId(tipo.id)}
            />
          ))}
        </ScrollView>

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
            <Chip
              etiqueta="Cerca mío"
              activo={soloCerca}
              onPress={() => setSoloCerca((valor) => !valor)}
            />
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

        {sesionVencida ? (
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>{MENSAJE_SESION_VENCIDA}</Text>
            <Pressable onPress={cerrarAvisoSesionVencida} accessibilityRole="button">
              <Text style={styles.avisoCerrar}>Cerrar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View
        onLayout={(evento) => setAltoPie(evento.nativeEvent.layout.height)}
        style={[styles.pie, { paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.pieIntro}>
          <View style={styles.iconoPie}>
            <Ionicons name="person-outline" size={20} color={Paleta.tealDeep} />
          </View>
          <View style={styles.pieTextos}>
            <Text style={styles.pieTitulo}>
              {pedirIdentidad ? "¿Sos vecino?" : "Reportá un problema"}
            </Text>
            <Text style={styles.pieCuerpo}>
              Así podés reportar problemas y seguir tus reclamos. Para mirar el mapa no hace falta.
            </Text>
          </View>
        </View>
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
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/login")}
          style={styles.acceso}
        >
          <Ionicons name="lock-closed-outline" size={14} color={Paleta.inkSoft} />
          <Text style={styles.accesoTexto}>Acceso para operadores municipales</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({
  etiqueta,
  activo,
  onPress,
  tipoId,
  iconoApp = false,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  tipoId?: string;
  iconoApp?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[styles.chip, activo ? styles.chipActivo : null]}
    >
      {iconoApp ? (
        <Ionicons
          name="apps-outline"
          size={16}
          color={activo ? Paleta.paperRaised : Paleta.ink}
        />
      ) : null}
      {tipoId ? (
        <IconoCategoria
          tipoId={tipoId}
          size={16}
          color={activo ? Paleta.paperRaised : undefined}
        />
      ) : null}
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
    backgroundColor: Paleta.paper,
  },
  cabecera: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 10,
  },
  tarjetaCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Paleta.line,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  titulos: {
    flex: 1,
    gap: 2,
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
  },
  botonFiltro: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.tealSoft,
  },
  botonFiltroActivo: {
    backgroundColor: Paleta.tealDeep,
  },
  chips: {
    gap: 12,
    paddingRight: 8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: Paleta.paper,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  chipActivo: {
    backgroundColor: Paleta.tealDeep,
    borderColor: Paleta.tealDeep,
  },
  chipTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.ink,
  },
  chipTextoActivo: {
    color: Paleta.paperRaised,
  },
  aviso: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FDECEC",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.rojo,
    lineHeight: 18,
  },
  avisoCerrar: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.ink,
  },
  mapa: {
    flex: 1,
    backgroundColor: Paleta.tealSoft,
  },
  ubicar: {
    position: "absolute",
    right: 16,
    zIndex: 30,
    elevation: 30,
  },
  ubicarCirculo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  panelFiltros: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  panelTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
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
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  listo: {
    alignSelf: "flex-end",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  listoTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.teal,
  },
  pie: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Paleta.paperRaised,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  pieIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconoPie: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.tealSoft,
  },
  pieTextos: {
    flex: 1,
    gap: 2,
  },
  pieTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Paleta.ink,
  },
  pieCuerpo: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Paleta.inkSoft,
  },
  noSoyYo: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Paleta.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.paperRaised,
  },
  noSoyYoTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Paleta.ink,
  },
  acceso: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 36,
  },
  accesoTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
});
