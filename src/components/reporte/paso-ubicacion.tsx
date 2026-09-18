import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import {
  COORDENADAS_CENTRO,
  direccionDesdeCoordenadas,
  obtenerUbicacionActual,
} from "@/servicios/ubicacion";
import { Coordenadas } from "@/tipos";

type Props = {
  latitud: number | null;
  longitud: number | null;
  direccion: string;
  onUbicacion: (coords: Coordenadas, direccion: string) => void;
};

export function PasoUbicacion({
  latitud,
  longitud,
  direccion,
  onUbicacion,
}: Props) {
  const [cargando, setCargando] = useState(latitud == null);
  const [error, setError] = useState<string | null>(null);
  const [mapaClave, setMapaClave] = useState(0);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUbicacionRef = useRef(onUbicacion);
  onUbicacionRef.current = onUbicacion;

  const coords: Coordenadas = {
    latitud: latitud ?? COORDENADAS_CENTRO.latitud,
    longitud: longitud ?? COORDENADAS_CENTRO.longitud,
  };

  useEffect(() => {
    if (latitud != null && longitud != null) {
      return;
    }
    let activo = true;
    (async () => {
      try {
        const actual = await obtenerUbicacionActual();
        const texto = await direccionDesdeCoordenadas(actual);
        if (activo) {
          onUbicacionRef.current(actual, texto);
        }
      } catch {
        if (activo) {
          setError("No pudimos usar el GPS. Mové el pin o probá de nuevo.");
          onUbicacionRef.current(COORDENADAS_CENTRO, "Gualeguaychú");
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
  }, [latitud, longitud]);

  function aplicarCoords(siguiente: Coordenadas) {
    onUbicacionRef.current(siguiente, direccion);
    if (geocodeTimer.current) {
      clearTimeout(geocodeTimer.current);
    }
    geocodeTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const texto = await direccionDesdeCoordenadas(siguiente);
          onUbicacionRef.current(siguiente, texto);
          setError(null);
        } catch {
          onUbicacionRef.current(siguiente, direccion || "Gualeguaychú");
        }
      })();
    }, 400);
  }

  async function usarUbicacionActual() {
    setCargando(true);
    setError(null);
    try {
      const actual = await obtenerUbicacionActual();
      const texto = await direccionDesdeCoordenadas(actual);
      onUbicacionRef.current(actual, texto);
      setMapaClave((clave) => clave + 1);
    } catch {
      setError("No pudimos leer tu ubicación. Revisá el permiso de GPS.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View>
      <Text style={styles.direccion}>
        {cargando ? "Buscando tu ubicación…" : direccion}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.mapa} accessibilityLabel="Mapa para marcar el problema">
        {Platform.OS === "web" ? (
          <Text style={styles.mapaWeb}>
            El mapa con el pin se ve en el celular. En la web usamos el centro de la ciudad.
          </Text>
        ) : (
          <MapView
            key={mapaClave}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: coords.latitud,
              longitude: coords.longitud,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          >
            <Marker
              coordinate={{
                latitude: coords.latitud,
                longitude: coords.longitud,
              }}
              draggable
              onDragEnd={(evento) => {
                aplicarCoords({
                  latitud: evento.nativeEvent.coordinate.latitude,
                  longitud: evento.nativeEvent.coordinate.longitude,
                });
              }}
            />
          </MapView>
        )}
      </View>
      <Text style={styles.pista}>Arrastrá el pin si hay que corregir el punto.</Text>
      <Boton
        titulo="Usar ubicación actual"
        variante="secundario"
        cargando={cargando}
        disabled={cargando}
        onPress={() => void usarUbicacionActual()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  direccion: {
    fontSize: 15,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 8,
  },
  error: {
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 8,
  },
  mapa: {
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E1F5EE",
    marginBottom: 8,
  },
  mapaWeb: {
    flex: 1,
    padding: 24,
    textAlign: "center",
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  pista: {
    fontSize: 13,
    color: Paleta.inkSoft,
    marginBottom: 16,
  },
});
