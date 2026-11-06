import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";

import IconoPrincipal from "@/assets/branding/icono_principal.svg";
import { MapView, Marker } from "@/components/mapa";
import { Boton } from "@/components/ui/boton";
import { BotonTema } from "@/components/ui/boton-tema";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { IndicadorRecarga } from "@/components/ui/indicador-recarga";
import { obtenerCategoriaVisual } from "@/constants/categorias";
import { Fonts } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
import { tiposReporteMock } from "@/mocks/reportes";
import {
  alActualizarColaReportes,
  alEstadoSincronizacionRed,
  obtenerReportes,
} from "@/servicios/reportes";
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
  const tema = useTheme();
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
  const [ubicando, setUbicando] = useState(false);
  const [sincronizandoRed, setSincronizandoRed] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [altoTarjeta, setAltoTarjeta] = useState(0);
  const mapaRef = useRef<ComponentRef<typeof MapView>>(null);
  const ignorarToqueMapa = useRef(false);

  function centrarEn(coords: Coordenadas) {
    const siguiente = {
      latitude: coords.latitud,
      longitude: coords.longitud,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setOrigen(coords);
    setRegion(siguiente);
    const mapa = mapaRef.current as {
      animateToRegion?: (region: typeof siguiente, ms: number) => void;
    } | null;
    mapa?.animateToRegion?.(siguiente, 450);
  }

  const confirmarCerrarSesion = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Estás seguro de que querés cerrar sesión?")) {
        void cerrarSesion();
      }
      return;
    }

    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que querés cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            void cerrarSesion();
          },
        },
      ],
    );
  };

  useEffect(() => {
    let activo = true;

    function cargarReportes() {
      obtenerReportes()
        .then((lista) => {
          if (activo) {
            setReportes(lista);
          }
        })
        .catch(() => {});
    }

    cargarReportes();

    obtenerUbicacionActual()
      .then((coords) => {
        if (!activo) return;
        centrarEn(coords);
      })
      .catch(() => {});

    const dejarDeEscucharCola = alActualizarColaReportes(() => {
      cargarReportes();
    });
    const dejarDeEscucharSync = alEstadoSincronizacionRed((activo) => {
      setSincronizandoRed(activo);
      if (!activo) {
        cargarReportes();
      }
    });

    return () => {
      activo = false;
      dejarDeEscucharCola();
      dejarDeEscucharSync();
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

  const seleccionado = visibles.find((item) => item.id === seleccionadoId) ?? null;
  const filtrosActivos = [filtroEstado, soloCerca || null].filter(Boolean).length;

  return (
    <View style={[styles.pantalla, { backgroundColor: tema.background }]}>
      <StatusBar style={tema.esOscuro ? "light" : "dark"} />
      <View
        style={[
          styles.cabecera,
          {
            backgroundColor: tema.background,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <View
          style={[
            styles.cabeceraFila,
            {
              backgroundColor: tema.surface,
              borderColor: tema.outline,
            },
          ]}
        >
          <IconoPrincipal
            width={40}
            height={40}
            accessibilityLabel="Reporte Ciudadano"
          />
          <View style={styles.titulos}>
            <Text style={[styles.titulo, { color: tema.onSurface }]} numberOfLines={1}>
              Gualeguaychú
            </Text>
            <Text style={[styles.subtitulo, { color: tema.onSurfaceVariant }]} numberOfLines={1}>
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
              { backgroundColor: tema.primaryContainer },
              filtrosActivos > 0 && { backgroundColor: tema.primary },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filtrosActivos > 0 ? tema.onPrimary : tema.onPrimaryContainer}
            />
          </Pressable>
          <BotonTema />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={confirmarCerrarSesion}
            hitSlop={8}
            style={({ pressed }) => [
              styles.avatar,
              { backgroundColor: tema.primaryContainer },
              pressed ? styles.avatarPresionado : null,
            ]}
          >
            <Text style={[styles.avatarLetra, { color: tema.onPrimaryContainer }]}>
              {nombre.trim().charAt(0).toUpperCase() || "V"}
            </Text>
            <View
              style={[
                styles.avatarInsigniaSalir,
                {
                  backgroundColor: tema.primary,
                  borderColor: tema.surface,
                },
              ]}
            >
              <Ionicons name="log-out-outline" size={11} color={tema.onPrimary} />
            </View>
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

      <View style={[styles.mapa, { backgroundColor: tema.background }]} accessibilityLabel="Mapa de reportes">
        <MapView
          ref={mapaRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsMyLocationButton={false}
          showsUserLocation
          onPress={() => {
            if (ignorarToqueMapa.current) return;
            setSeleccionadoId(null);
          }}
        >
          {visibles.map((reporte) => {
            const elegido = seleccionado?.id === reporte.id;
            return (
              <Marker
                key={reporte.id}
                coordinate={{
                  latitude: reporte.coordenadas.latitud,
                  longitude: reporte.coordenadas.longitud,
                }}
                pinColor={COLORES_ESTADO[reporte.estado]}
                opacity={seleccionado && !elegido ? 0.45 : 1}
                zIndex={elegido ? 2 : 0}
                onPress={() => {
                  ignorarToqueMapa.current = true;
                  setSeleccionadoId(reporte.id);
                  setTimeout(() => {
                    ignorarToqueMapa.current = false;
                  }, 350);
                }}
              />
            );
          })}
        </MapView>
        <IndicadorRecarga visible={sincronizandoRed} />

        <View
          style={[
            styles.resumen,
            {
              backgroundColor: tema.surface,
              borderColor: tema.outline,
              borderWidth: tema.esOscuro ? 1 : 0,
            },
          ]}
          accessibilityRole="text"
        >
          <Text style={[styles.resumenTexto, { color: tema.onSurface }]}>{resumen}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: soloCerca }}
            accessibilityLabel="Cerca mío"
            onPress={() => setSoloCerca((valor) => !valor)}
            style={[
              styles.cercaChip,
              { backgroundColor: tema.primaryContainer },
              soloCerca && { backgroundColor: tema.primary },
            ]}
          >
            <Text
              style={[
                styles.cercaTexto,
                { color: tema.onPrimaryContainer },
                soloCerca && { color: tema.onPrimary },
              ]}
            >
              Cerca mío
            </Text>
          </Pressable>
        </View>

        {filtrosAbiertos ? (
          <View
            style={[
              styles.panelFiltros,
              {
                backgroundColor: tema.surface,
                borderColor: tema.outline,
                borderWidth: tema.esOscuro ? 1 : 0,
              },
            ]}
          >
            <Text style={[styles.panelTitulo, { color: tema.onSurfaceVariant }]}>Estado</Text>
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
              <Text style={[styles.listoTexto, { color: tema.primary }]}>Listo</Text>
            </Pressable>
          </View>
        ) : null}
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
            .catch(() => {})
            .finally(() => setUbicando(false));
        }}
        style={[styles.ubicar, seleccionado ? { bottom: altoTarjeta + 28 } : null]}
      >
        <View
          style={[
            styles.ubicarCirculo,
            {
              backgroundColor: tema.surface,
              borderColor: tema.outline,
            },
          ]}
          collapsable={false}
        >
          {ubicando ? (
            <ActivityIndicator color={tema.primary} />
          ) : (
            <Ionicons name="locate" size={22} color={tema.primary} />
          )}
        </View>
      </Pressable>

      {seleccionado ? (
        <TarjetaMapa
          reporte={seleccionado}
          onAlto={setAltoTarjeta}
          onCerrar={() => setSeleccionadoId(null)}
          onVer={() => router.push(`/reclamo/${seleccionado.id}`)}
        />
      ) : null}
    </View>
  );
}

function TarjetaMapa({
  reporte,
  onAlto,
  onCerrar,
  onVer,
}: {
  reporte: Reporte;
  onAlto: (alto: number) => void;
  onCerrar: () => void;
  onVer: () => void;
}) {
  const tema = useTheme();
  const categoria = obtenerCategoriaVisual(reporte.tipoId);
  const tipo = tiposReporteMock.find((item) => item.id === reporte.tipoId);
  const nombre = categoria?.nombre ?? tipo?.nombre ?? "Reporte";
  const foto =
    reporte.fotos.find((item) => item.esPrincipal)?.url ?? reporte.fotos[0]?.url;
  const estado = etiquetaEstadoPublico(reporte.estado);

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: tema.surface,
          borderColor: tema.outline,
          borderWidth: tema.esOscuro ? 1 : 0,
        },
      ]}
      onLayout={(evento) => onAlto(evento.nativeEvent.layout.height)}
      accessibilityRole="summary"
      accessibilityLabel={`${nombre}, ${estado}, ${reporte.direccion}`}
    >
      <View style={styles.tarjetaFila}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.tarjetaFoto} />
        ) : (
          <View
            style={[
              styles.tarjetaFoto,
              styles.tarjetaFotoVacia,
              { backgroundColor: tema.primaryContainer },
            ]}
          >
            <IconoCategoria tipoId={reporte.tipoId} size={28} />
          </View>
        )}
        <View style={styles.tarjetaTexto}>
          <Text style={[styles.tarjetaNombre, { color: tema.onSurface }]} numberOfLines={1}>
            {nombre}
          </Text>
          <View style={styles.tarjetaEstado}>
            <View
              style={[
                styles.tarjetaPunto,
                { backgroundColor: COLORES_ESTADO[reporte.estado] },
              ]}
            />
            <Text style={[styles.tarjetaEstadoTexto, { color: tema.onSurface }]}>{estado}</Text>
          </View>
          <Text style={[styles.tarjetaDireccion, { color: tema.onSurfaceVariant }]} numberOfLines={1}>
            {reporte.direccion}
          </Text>
          {reporte.descripcion ? (
            <Text style={[styles.tarjetaDescripcion, { color: tema.onSurfaceVariant }]} numberOfLines={1}>
              {reporte.descripcion}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={8}
          onPress={onCerrar}
        >
          <Ionicons name="close" size={20} color={tema.onSurfaceVariant} />
        </Pressable>
      </View>
      <Boton titulo="Ver reclamo" onPress={onVer} />
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
  const tema = useTheme();
  const seleccionado = activo && !sobreClaro;

  const fondo = activo
    ? tema.primary
    : sobreClaro
    ? tema.surfaceVariant
    : tema.surface;

  const borde = activo ? tema.primary : tema.outline;
  const colorTexto = activo ? tema.onPrimary : tema.onSurface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: fondo,
          borderColor: borde,
        },
      ]}
    >
      {iconoApp ? (
        <Ionicons
          name="apps-outline"
          size={16}
          color={colorTexto}
        />
      ) : null}
      {tipoId ? (
        <IconoCategoria
          tipoId={tipoId}
          size={16}
          color={seleccionado ? tema.onPrimary : undefined}
        />
      ) : null}
      <Text
        style={[
          styles.chipTexto,
          { color: colorTexto },
          activo && styles.chipTextoActivo,
        ]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  const tema = useTheme();

  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.leyendaPunto, { backgroundColor: color }]} />
      <Text style={[styles.leyendaTexto, { color: tema.onSurfaceVariant }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  cabecera: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  cabeceraFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  titulos: { flex: 1, gap: 2 },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  avatar: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPresionado: { opacity: 0.85 },
  avatarLetra: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  avatarInsigniaSalir: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  botonFiltro: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: 1,
  },
  chipTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  chipTextoActivo: {
    fontFamily: Fonts.semiBold,
  },
  mapa: {
    flex: 1,
    overflow: "hidden",
  },
  ubicar: {
    position: "absolute",
    right: 16,
    bottom: 16,
    zIndex: 30,
    elevation: 30,
  },
  ubicarCirculo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  resumen: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  resumenTexto: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  cercaChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: "center",
  },
  cercaTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  panelFiltros: {
    position: "absolute",
    top: 68,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
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
  },
  tarjeta: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 40,
    elevation: 16,
    borderRadius: 20,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  tarjetaFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tarjetaFoto: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  tarjetaFotoVacia: {
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaTexto: { flex: 1, gap: 2 },
  tarjetaNombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  tarjetaEstado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tarjetaPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tarjetaEstadoTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  tarjetaDireccion: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  tarjetaDescripcion: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
});