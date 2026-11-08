import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { MapView, Marker } from "@/components/mapa";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { nombreTipo } from "@/servicios/bandeja";
import {
  RADIO_DUPLICADO_M,
  reportesDentroDeRadio,
  type ReporteCercano,
} from "@/servicios/mapa";
import { obtenerReportesCercanos } from "@/servicios/reportes";
import {
  COORDENADAS_CENTRO,
  DIRECCION_SIN_CONEXION,
  direccionDesdeCoordenadas,
  esDireccionAceptable,
  estaEnLaCiudad,
  MENSAJE_FUERA_DE_LA_CIUDAD,
  obtenerUbicacionActual,
} from "@/servicios/ubicacion";
import { Coordenadas, Reporte } from "@/tipos";

type Props = {
  tipoId: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string;
  onUbicacion: (coords: Coordenadas, direccion: string) => void;
  onElegirCercano: (reporte: Reporte | null) => void;
  onMapaOcupado?: (ocupado: boolean) => void;
  sumando?: boolean;
};

export function PasoUbicacion({
  tipoId,
  latitud,
  longitud,
  direccion,
  onUbicacion,
  onElegirCercano,
  onMapaOcupado,
  sumando = false,
}: Props) {
  const tema = useTheme();
  const [cargando, setCargando] = useState(latitud == null);
  const [resolviendoCalle, setResolviendoCalle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapaClave, setMapaClave] = useState(0);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [errorCercanos, setErrorCercanos] = useState<string | null>(null);
  const [eleccion, setEleccion] = useState("nuevo");
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUbicacionRef = useRef(onUbicacion);
  const onMapaOcupadoRef = useRef(onMapaOcupado);
  onUbicacionRef.current = onUbicacion;
  onMapaOcupadoRef.current = onMapaOcupado;

  const coords: Coordenadas = {
    latitud: latitud ?? COORDENADAS_CENTRO.latitud,
    longitud: longitud ?? COORDENADAS_CENTRO.longitud,
  };

  useEffect(() => {
    let activo = true;
    setReportes([]);
    setErrorCercanos(null);
    if (latitud == null || longitud == null) {
      return () => {
        activo = false;
      };
    }

    const timer = setTimeout(() => {
      obtenerReportesCercanos({ latitud, longitud }, tipoId)
        .then((lista) => {
          if (activo) {
            setReportes(lista);
          }
        })
        .catch(() => {
          if (activo) {
            setErrorCercanos("No pudimos consultar los reclamos cercanos.");
          }
        });
    }, 250);
    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [latitud, longitud, tipoId]);

  useEffect(() => {
    if (latitud != null && longitud != null) return;
    let activo = true;
    (async () => {
      try {
        const actual = await obtenerUbicacionActual();
        if (!activo) return;
        setResolviendoCalle(true);
        const texto = await direccionDesdeCoordenadas(actual);
        if (activo) {
          onUbicacionRef.current(actual, texto);
          if (!esDireccionAceptable(texto)) {
            setError("No encontramos la calle. Arrastrá el pin o tocá el mapa.");
          } else {
            setError(null);
          }
        }
      } catch {
        if (activo) {
          setError("No pudimos usar el GPS. Arrastrá el pin o tocá el mapa.");
          onUbicacionRef.current(COORDENADAS_CENTRO, "");
        }
      } finally {
        if (activo) {
          setCargando(false);
          setResolviendoCalle(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, [latitud, longitud]);

  const cercanos = reportesDentroDeRadio({
    reportes,
    origen: coords,
    radioMetros: RADIO_DUPLICADO_M,
    tipoId,
    soloAbiertos: true,
  });
  const idsCercanos = cercanos.map((item) => item.reporte.id).join("|");

  useEffect(() => {
    onElegirCercano(null);
  }, [onElegirCercano]);

  useEffect(() => {
    if (eleccion === "nuevo") return;
    if (!idsCercanos.split("|").filter(Boolean).includes(eleccion)) {
      setEleccion("nuevo");
      onElegirCercano(null);
    }
  }, [eleccion, idsCercanos, onElegirCercano]);

  function ocuparMapa(ocupado: boolean) {
    onMapaOcupadoRef.current?.(ocupado);
  }

  function aplicarCoords(siguiente: Coordenadas) {
    onUbicacionRef.current(siguiente, direccion);
    if (!estaEnLaCiudad(siguiente)) {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      setResolviendoCalle(false);
      setError(MENSAJE_FUERA_DE_LA_CIUDAD);
      return;
    }
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    setResolviendoCalle(true);
    geocodeTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const texto = await direccionDesdeCoordenadas(siguiente);
          onUbicacionRef.current(siguiente, texto);
          setError(
            !estaEnLaCiudad(siguiente)
              ? MENSAJE_FUERA_DE_LA_CIUDAD
              : esDireccionAceptable(texto)
                ? null
                : "No encontramos la calle. Arrastrá el pin un poco más.",
          );
        } catch {
          const respaldo = esDireccionAceptable(direccion)
            ? direccion
            : DIRECCION_SIN_CONEXION;
          onUbicacionRef.current(siguiente, respaldo);
          setError(
            !estaEnLaCiudad(siguiente)
              ? MENSAJE_FUERA_DE_LA_CIUDAD
              : respaldo === DIRECCION_SIN_CONEXION
                ? null
                : "No encontramos la calle. Arrastrá el pin o tocá el mapa.",
          );
        } finally {
          setResolviendoCalle(false);
        }
      })();
    }, 450);
  }

  function elegir(id: string) {
    setEleccion(id);
    if (id === "nuevo") {
      onElegirCercano(null);
      return;
    }
    onElegirCercano(cercanos.find((item) => item.reporte.id === id)?.reporte ?? null);
  }

  async function usarUbicacionActual() {
    setCargando(true);
    setResolviendoCalle(true);
    setError(null);
    try {
      const actual = await obtenerUbicacionActual();
      onUbicacionRef.current(actual, direccion);
      setMapaClave((clave) => clave + 1);
      if (!estaEnLaCiudad(actual)) {
        setError(MENSAJE_FUERA_DE_LA_CIUDAD);
        setResolviendoCalle(false);
        return;
      }
      const texto = await direccionDesdeCoordenadas(actual);
      onUbicacionRef.current(actual, texto);
      if (!esDireccionAceptable(texto)) {
        setError("No encontramos la calle. Arrastrá el pin o tocá el mapa.");
      } else {
        setError(null);
      }
    } catch {
      setError("No pudimos leer tu ubicación. Revisá el permiso de GPS.");
    } finally {
      setCargando(false);
      setResolviendoCalle(false);
    }
  }

  const textoDireccion =
    cargando || resolviendoCalle
      ? "Buscando la calle…"
      : esDireccionAceptable(direccion)
        ? direccion
        : "Mové el pin hasta ver la calle";

  return (
    <View>
      <View
        style={[
          styles.mapa,
          {
            backgroundColor: tema.surfaceVariant,
            borderColor: tema.outline,
            borderWidth: tema.esOscuro ? 1 : 0,
          },
        ]}
        accessibilityLabel="Mapa para marcar el problema"
      >
        <MapView
          key={mapaClave}
          style={StyleSheet.absoluteFill}
          mensaje="El mapa con el pin se ve en el celular. En la web usamos el centro de la ciudad."
          initialRegion={{
            latitude: coords.latitud,
            longitude: coords.longitud,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          moveOnMarkerPress={false}
          onPress={(evento) => {
            aplicarCoords({
              latitud: evento.nativeEvent.coordinate.latitude,
              longitud: evento.nativeEvent.coordinate.longitude,
            });
          }}
        >
          {cercanos.map(({ reporte }) => (
            <Marker
              key={reporte.id}
              coordinate={{
                latitude: reporte.coordenadas.latitud,
                longitude: reporte.coordenadas.longitud,
              }}
              pinColor="#8E9AAB"
              title={nombreTipo(reporte.tipoId)}
              description={reporte.direccion}
            />
          ))}
          <Marker
            coordinate={{
              latitude: coords.latitud,
              longitude: coords.longitud,
            }}
            pinColor={tema.primary}
            draggable
            onDragStart={() => ocuparMapa(true)}
            onDragEnd={(evento) => {
              ocuparMapa(false);
              aplicarCoords({
                latitud: evento.nativeEvent.coordinate.latitude,
                longitud: evento.nativeEvent.coordinate.longitude,
              });
            }}
          />
        </MapView>

        <View style={styles.direccionCapa} pointerEvents="none">
          <View
            style={[
              styles.direccionChip,
              {
                backgroundColor: tema.surface,
                borderColor: tema.outline,
                borderWidth: tema.esOscuro ? 1 : 0,
              },
            ]}
          >
            <Text style={[styles.direccionTexto, { color: tema.onSurface }]} numberOfLines={2}>
              {textoDireccion}
            </Text>
          </View>
        </View>

        <View style={styles.pista} pointerEvents="none">
          <Text style={styles.pistaTexto}>Arrastrá el pin o tocá el mapa</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Usar ubicación actual"
          disabled={cargando}
          onPress={() => void usarUbicacionActual()}
          style={[
            styles.ubicar,
            {
              backgroundColor: tema.surface,
              borderColor: tema.outline,
              borderWidth: 1,
            },
          ]}
        >
          {cargando ? (
            <ActivityIndicator color={tema.primary} />
          ) : (
            <Ionicons name="locate-outline" size={22} color={tema.primary} />
          )}
        </Pressable>
      </View>

      {error ? <Text style={[styles.error, { color: tema.error }]}>{error}</Text> : null}
      {errorCercanos ? (
        <Text style={[styles.error, { color: tema.error }]}>{errorCercanos}</Text>
      ) : null}

      {cercanos.length > 0 ? (
        <View style={styles.duplicados}>
          <Text style={[styles.duplicadosTitulo, { color: tema.onSurface }]}>
            {cercanos.length === 1
              ? "Hay 1 reporte a 100 m o menos"
              : `Hay ${cercanos.length} reportes a 100 m o menos`}
          </Text>
          <Text style={[styles.duplicadosSub, { color: tema.onSurfaceVariant }]}>
            ¿Alguno es el mismo problema?
          </Text>
          {cercanos.map((item) => (
            <OpcionRadio
              key={item.reporte.id}
              activo={eleccion === item.reporte.id}
              titulo={`${nombreTipo(item.reporte.tipoId)} · ${item.reporte.direccion}`}
              detalle={detalleCercano(item)}
              disabled={sumando}
              onPress={() => elegir(item.reporte.id)}
            />
          ))}
          <OpcionRadio
            activo={eleccion === "nuevo"}
            titulo="Es otro problema"
            detalle="Se crea un reporte nuevo"
            disabled={sumando}
            onPress={() => elegir("nuevo")}
          />
        </View>
      ) : null}
    </View>
  );
}

function detalleCercano(item: ReporteCercano) {
  const adhesiones = item.reporte.adhesiones;
  const vecinos =
    adhesiones === 0
      ? "Sin vecinos sumados"
      : adhesiones === 1
        ? "1 vecino sumado"
        : `${adhesiones} vecinos sumados`;
  return `A ${item.metros} m · ${vecinos}`;
}

function OpcionRadio({
  activo,
  titulo,
  detalle,
  disabled,
  onPress,
}: {
  activo: boolean;
  titulo: string;
  detalle: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const tema = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: activo, disabled }}
      accessibilityLabel={`${titulo}. ${detalle}`}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.opcion,
        {
          backgroundColor: tema.surface,
          borderColor: tema.outline,
        },
        activo && {
          borderColor: tema.primary,
          backgroundColor: tema.primaryContainer,
        },
      ]}
    >
      <View
        style={[
          styles.radio,
          { borderColor: tema.outline },
          activo && { borderColor: tema.primary },
        ]}
      >
        {activo ? (
          <View style={[styles.radioPunto, { backgroundColor: tema.primary }]} />
        ) : null}
      </View>
      <View style={styles.opcionTexto}>
        <Text style={[styles.opcionTitulo, { color: tema.onSurface }]}>{titulo}</Text>
        <Text style={[styles.opcionDetalle, { color: tema.onSurfaceVariant }]}>{detalle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mapa: {
    height: 230,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
  },
  direccionCapa: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  direccionChip: {
    maxWidth: "100%",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  direccionTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    textAlign: "center",
  },
  pista: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pistaTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: "#FFFFFF",
  },
  ubicar: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 12,
  },
  duplicados: {
    gap: 10,
  },
  duplicadosTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  duplicadosSub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    marginTop: -4,
    marginBottom: 2,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioPunto: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  opcionTexto: {
    flex: 1,
    gap: 2,
  },
  opcionTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  opcionDetalle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
});