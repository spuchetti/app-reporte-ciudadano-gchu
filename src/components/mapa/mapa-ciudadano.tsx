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
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { IndicadorRecarga } from "@/components/ui/indicador-recarga";
import { obtenerCategoriaVisual } from "@/constants/categorias";
import { Fonts, Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
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
        {
          text: "Cancelar",
          style: "cancel",
        },
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
        if (!activo) {
          return;
        }
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
            onPress={confirmarCerrarSesion}
            hitSlop={8}
            style={({ pressed }) => [
              styles.avatar,
              pressed ? styles.avatarPresionado : null,
            ]}
          >
            <Text style={styles.avatarLetra}>
              {nombre.trim().charAt(0).toUpperCase() || "V"}
            </Text>
            <View style={styles.avatarInsigniaSalir}>
              <Ionicons name="log-out-outline" size={11} color={Paleta.paperRaised} />
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

      <View style={styles.mapa} accessibilityLabel="Mapa de reportes">
        <MapView
          ref={mapaRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsMyLocationButton={false}
          showsUserLocation
          onPress={() => {
            if (ignorarToqueMapa.current) {
              return;
            }
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
        style={[styles.ubicar, seleccionado ? { bottom: altoTarjeta + 28 } : null]}
      >
        <View style={styles.ubicarCirculo} collapsable={false}>
          {ubicando ? (
            <ActivityIndicator color={Paleta.tealDeep} />
          ) : (
            <Ionicons name="locate" size={22} color={Paleta.tealDeep} />
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
  const categoria = obtenerCategoriaVisual(reporte.tipoId);
  const tipo = tiposReporteMock.find((item) => item.id === reporte.tipoId);
  const nombre = categoria?.nombre ?? tipo?.nombre ?? "Reporte";
  const foto =
    reporte.fotos.find((item) => item.esPrincipal)?.url ?? reporte.fotos[0]?.url;
  const estado = etiquetaEstadoPublico(reporte.estado);

  return (
    <View
      style={styles.tarjeta}
      onLayout={(evento) => onAlto(evento.nativeEvent.layout.height)}
      accessibilityRole="summary"
      accessibilityLabel={`${nombre}, ${estado}, ${reporte.direccion}`}
    >
      <View style={styles.tarjetaFila}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.tarjetaFoto} />
        ) : (
          <View style={[styles.tarjetaFoto, styles.tarjetaFotoVacia]}>
            <IconoCategoria tipoId={reporte.tipoId} size={28} />
          </View>
        )}
        <View style={styles.tarjetaTexto}>
          <Text style={styles.tarjetaNombre} numberOfLines={1}>
            {nombre}
          </Text>
          <View style={styles.tarjetaEstado}>
            <View
              style={[
                styles.tarjetaPunto,
                { backgroundColor: COLORES_ESTADO[reporte.estado] },
              ]}
            />
            <Text style={styles.tarjetaEstadoTexto}>{estado}</Text>
          </View>
          <Text style={styles.tarjetaDireccion} numberOfLines={1}>
            {reporte.direccion}
          </Text>
          {reporte.descripcion ? (
            <Text style={styles.tarjetaDescripcion} numberOfLines={1}>
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
          <Ionicons name="close" size={20} color={Paleta.inkSoft} />
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
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Paleta.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPresionado: {
    opacity: 0.85,
  },
  avatarLetra: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.tealDeep,
  },
  avatarInsigniaSalir: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Paleta.tealDeep,
    borderWidth: 1.5,
    borderColor: Paleta.paperRaised,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: "#0F172A",
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
  tarjeta: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 40,
    elevation: 16,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 20,
    padding: 12,
    gap: 12,
    shadowColor: "#0F172A",
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
    backgroundColor: Paleta.tealSoft,
  },
  tarjetaFotoVacia: {
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaTexto: {
    flex: 1,
    gap: 2,
  },
  tarjetaNombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Paleta.ink,
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
    color: Paleta.ink,
  },
  tarjetaDireccion: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  tarjetaDescripcion: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
});