import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { MapView, Marker } from "@/components/mapa";
import { Fonts, Paleta } from "@/constants/theme";
import { nombreTipo } from "@/servicios/bandeja";
import {
  RADIO_DUPLICADO_M,
  reportesDentroDeRadio,
  type ReporteCercano,
} from "@/servicios/mapa";
import { obtenerReportes } from "@/servicios/reportes";
import {
  COORDENADAS_CENTRO,
  DIRECCION_SIN_CONEXION,
  direccionDesdeCoordenadas,
  esDireccionAceptable,
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
  const [cargando, setCargando] = useState(latitud == null);
  const [resolviendoCalle, setResolviendoCalle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapaClave, setMapaClave] = useState(0);
  const [reportes, setReportes] = useState<Reporte[]>([]);
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
    obtenerReportes()
      .then((lista) => {
        if (activo) {
          setReportes(lista);
        }
      })
      .catch(() => {
        // Si falla el listado, igual se puede marcar el pin.
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (latitud != null && longitud != null) {
      return;
    }
    let activo = true;
    (async () => {
      try {
        const actual = await obtenerUbicacionActual();
        if (!activo) {
          return;
        }
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
    if (eleccion === "nuevo") {
      return;
    }
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
    if (geocodeTimer.current) {
      clearTimeout(geocodeTimer.current);
    }
    setResolviendoCalle(true);
    geocodeTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const texto = await direccionDesdeCoordenadas(siguiente);
          onUbicacionRef.current(siguiente, texto);
          setError(
            esDireccionAceptable(texto)
              ? null
              : "No encontramos la calle. Arrastrá el pin un poco más.",
          );
        } catch {
          const respaldo = esDireccionAceptable(direccion)
            ? direccion
            : DIRECCION_SIN_CONEXION;
          onUbicacionRef.current(siguiente, respaldo);
          setError(
            respaldo === DIRECCION_SIN_CONEXION
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
      const texto = await direccionDesdeCoordenadas(actual);
      onUbicacionRef.current(actual, texto);
      setMapaClave((clave) => clave + 1);
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
      <View style={styles.mapa} accessibilityLabel="Mapa para marcar el problema">
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
          {/* Pin nativo: en Android el Marker custom no arrastra bien. */}
          <Marker
            coordinate={{
              latitude: coords.latitud,
              longitude: coords.longitud,
            }}
            pinColor={Paleta.teal}
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
          <View style={styles.direccionChip}>
            <Text style={styles.direccionTexto} numberOfLines={2}>
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
          style={styles.ubicar}
        >
          {cargando ? (
            <ActivityIndicator color={Paleta.tealDeep} />
          ) : (
            <Ionicons name="locate-outline" size={22} color={Paleta.ink} />
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {cercanos.length > 0 ? (
        <View style={styles.duplicados}>
          <Text style={styles.duplicadosTitulo}>
            {cercanos.length === 1
              ? "Hay 1 reporte a menos de 50 m"
              : `Hay ${cercanos.length} reportes a menos de 50 m`}
          </Text>
          <Text style={styles.duplicadosSub}>¿Alguno es el mismo problema?</Text>
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
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: activo, disabled }}
      accessibilityLabel={`${titulo}. ${detalle}`}
      disabled={disabled}
      onPress={onPress}
      style={[styles.opcion, activo ? styles.opcionActiva : null]}
    >
      <View style={[styles.radio, activo ? styles.radioActivo : null]}>
        {activo ? <View style={styles.radioPunto} /> : null}
      </View>
      <View style={styles.opcionTexto}>
        <Text style={styles.opcionTitulo}>{titulo}</Text>
        <Text style={styles.opcionDetalle}>{detalle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mapa: {
    height: 230,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Paleta.tealSoft,
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
    backgroundColor: Paleta.paperRaised,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  direccionTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.ink,
    textAlign: "center",
  },
  pista: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "#3A4553",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pistaTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.paperRaised,
  },
  ubicar: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Paleta.paperRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: Fonts.medium,
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 12,
  },
  duplicados: {
    gap: 10,
  },
  duplicadosTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Paleta.ink,
    lineHeight: 22,
  },
  duplicadosSub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    marginTop: -4,
    marginBottom: 2,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#E3E8EE",
    borderRadius: 16,
    backgroundColor: Paleta.paperRaised,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  opcionActiva: {
    borderColor: Paleta.teal,
    backgroundColor: Paleta.tealSoft,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C5CED6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActivo: {
    borderColor: Paleta.teal,
  },
  radioPunto: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Paleta.teal,
  },
  opcionTexto: {
    flex: 1,
    gap: 2,
  },
  opcionTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Paleta.ink,
  },
  opcionDetalle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
});
