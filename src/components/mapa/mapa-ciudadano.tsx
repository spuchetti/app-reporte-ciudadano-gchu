import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";

import IconoPrincipal from "@/assets/branding/icono_principal.svg";
import { MapView, Marker, Callout } from "@/components/mapa";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { obtenerCategoriaVisual } from "@/constants/categorias";
import { Fonts, Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { tiposReporteMock } from "@/mocks/reportes";
import { obtenerReportes } from "@/servicios/reportes";
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
import { COORDENADAS_CENTRO, obtenerUbicacionActual } from "@/servicios/ubicacion";
import { Coordenadas, Reporte } from "@/tipos";

const REGION_GCHU = {
  latitude: COORDENADAS_CENTRO.latitud,
  longitude: COORDENADAS_CENTRO.longitud,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export function MapaCiudadano() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const nombre =
    sesion?.esInvitado === false ? sesion.usuario.nombre : "Vecino";
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
      <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
        <View style={styles.cabeceraFila}>
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
              {`Hola, ${nombre}`}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => {
              void cerrarSesion();
            }}
            hitSlop={8}
            style={styles.avatar}
          >
            <Text style={styles.avatarLetra}>
              {nombre.trim().charAt(0).toUpperCase() || "V"}
            </Text>
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
      </View>

      <View style={styles.mapa} accessibilityLabel="Mapa de reportes">
        <MapView
          key={origen ? `${origen.latitud}-${origen.longitud}` : "ciudad"}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation
        >
          {visibles.map((reporte) => {
            const categoria = obtenerCategoriaVisual(reporte.tipoId);
            const tipo = tiposReporteMock.find((item) => item.id === reporte.tipoId);
            const nombre = categoria?.nombre ?? tipo?.nombre ?? "Reporte";
            return (
              <Marker
                key={reporte.id}
                coordinate={{
                  latitude: reporte.coordenadas.latitud,
                  longitude: reporte.coordenadas.longitud,
                }}
                pinColor={COLORES_ESTADO[reporte.estado]}
                title={`${etiquetaEstadoPublico(reporte.estado)} · ${reporte.codigo}`}
                description={reporte.direccion}
              >
                <Callout>
                  <View style={styles.burbuja}>
                    <View style={styles.burbujaTitulo}>
                      <IconoCategoria tipoId={reporte.tipoId} size={16} />
                      <Text style={styles.burbujaNombre}>{nombre}</Text>
                    </View>
                    <Text style={styles.burbujaTexto}>
                      {reporte.descripcion || reporte.direccion}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

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
                sobreClaro
                onPress={() => setFiltroEstado(null)}
              />
              {FILTROS_ESTADO_PUBLICO.map((item) => (
                <Chip
                  key={item.id}
                  etiqueta={item.etiqueta}
                  activo={filtroEstado === item.id}
                  sobreClaro
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
    </View>
  );
}

function Chip({
  etiqueta,
  activo,
  onPress,
  sobreClaro = false,
  tipoId,
  iconoApp = false,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  sobreClaro?: boolean;
  tipoId?: string;
  iconoApp?: boolean;
}) {
  const seleccionado = activo && !sobreClaro;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[
        styles.chip,
        sobreClaro ? styles.chipClaro : null,
        activo ? (sobreClaro ? styles.chipClaroActivo : styles.chipActivo) : null,
      ]}
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
          color={seleccionado ? Paleta.paperRaised : undefined}
        />
      ) : null}
      <Text
        style={[
          styles.chipTexto,
          sobreClaro ? styles.chipTextoClaro : null,
          activo
            ? sobreClaro
              ? styles.chipTextoClaroActivo
              : styles.chipTextoActivo
            : null,
        ]}
      >
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: Paleta.paper,
  },
  cabeceraFila: {
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
    lineHeight: 18,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Paleta.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.tealDeep,
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
    gap: 8,
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
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: Paleta.paperRaised,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  chipActivo: {
    backgroundColor: Paleta.tealDeep,
    borderColor: Paleta.tealDeep,
  },
  chipClaro: {
    backgroundColor: Paleta.paper,
    borderColor: Paleta.line,
  },
  chipClaroActivo: {
    backgroundColor: Paleta.teal,
    borderColor: Paleta.teal,
  },
  chipTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Paleta.ink,
  },
  chipTextoActivo: {
    color: Paleta.paperRaised,
  },
  chipTextoClaro: {
    color: Paleta.ink,
  },
  chipTextoClaroActivo: {
    color: Paleta.paperRaised,
  },
  mapa: {
    flex: 1,
    backgroundColor: Paleta.tealSoft,
    overflow: "hidden",
  },
  resumen: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  resumenTexto: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.ink,
  },
  cercaChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: "center",
    backgroundColor: Paleta.tealSoft,
  },
  cercaChipActivo: {
    backgroundColor: Paleta.teal,
  },
  cercaTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.tealDeep,
  },
  cercaTextoActivo: {
    color: Paleta.paperRaised,
  },
  panelFiltros: {
    position: "absolute",
    top: 68,
    left: 16,
    right: 16,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
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
  burbuja: {
    width: 220,
    gap: 4,
  },
  burbujaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  burbujaNombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.ink,
  },
  burbujaTexto: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
});
