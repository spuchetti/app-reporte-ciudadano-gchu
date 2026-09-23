import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MapView, Marker } from "@/components/mapa";
import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { nombreTipo } from "@/servicios/bandeja";
import {
  COLORES_ESTADO,
  RADIO_DUPLICADO_M,
  reportesDentroDeRadio,
  type ReporteCercano,
} from "@/servicios/mapa";
import { obtenerReportes } from "@/servicios/reportes";
import {
  COORDENADAS_CENTRO,
  direccionDesdeCoordenadas,
  obtenerUbicacionActual,
} from "@/servicios/ubicacion";
import { Coordenadas, Reporte } from "@/tipos";

type Props = {
  tipoId: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string;
  onUbicacion: (coords: Coordenadas, direccion: string) => void;
  onSumarse: (reporte: Reporte) => void;
  sumando?: boolean;
};

export function PasoUbicacion({
  tipoId,
  latitud,
  longitud,
  direccion,
  onUbicacion,
  onSumarse,
  sumando = false,
}: Props) {
  const [cargando, setCargando] = useState(latitud == null);
  const [error, setError] = useState<string | null>(null);
  const [mapaClave, setMapaClave] = useState(0);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUbicacionRef = useRef(onUbicacion);
  onUbicacionRef.current = onUbicacion;

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

  const cercanos = reportesDentroDeRadio({
    reportes,
    origen: coords,
    radioMetros: RADIO_DUPLICADO_M,
    tipoId,
    soloAbiertos: true,
  });

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
        >
          {cercanos.map(({ reporte }) => (
            <Marker
              key={reporte.id}
              coordinate={{
                latitude: reporte.coordenadas.latitud,
                longitude: reporte.coordenadas.longitud,
              }}
              pinColor={COLORES_ESTADO[reporte.estado]}
              title={nombreTipo(reporte.tipoId)}
              description={reporte.direccion}
            />
          ))}
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
      </View>
      <Text style={styles.pista}>Arrastrá el pin si hay que corregir el punto.</Text>

      {cercanos.length > 0 ? (
        <View style={styles.duplicados}>
          <Text style={styles.duplicadosTitulo}>
            Ya hay {cercanos.length === 1 ? "un reporte" : `${cercanos.length} reportes`} a menos de 50 m. ¿Es el mismo problema?
          </Text>
          {cercanos.map((item) => (
            <CercanoCard
              key={item.reporte.id}
              item={item}
              onSumarse={onSumarse}
              sumando={sumando}
            />
          ))}
          <Text style={styles.duplicadosPista}>
            Si no es el mismo, seguí y creamos uno nuevo.
          </Text>
        </View>
      ) : null}

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

function CercanoCard({
  item,
  onSumarse,
  sumando,
}: {
  item: ReporteCercano;
  onSumarse: (reporte: Reporte) => void;
  sumando: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTexto}>
        <Text style={styles.cardTitulo} numberOfLines={1}>
          {`${nombreTipo(item.reporte.tipoId)} · ${item.reporte.direccion}`}
        </Text>
        <Text style={styles.cardMeta}>
          {`${item.metros} m · ${item.reporte.adhesiones} ${item.reporte.adhesiones === 1 ? "vecino" : "vecinos"}`}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sumarme a ${item.reporte.codigo}`}
        disabled={sumando}
        onPress={() => onSumarse(item.reporte)}
        style={({ pressed }) => [styles.sumarme, pressed && styles.sumarmePressed]}
      >
        <Text style={styles.sumarmeTexto}>Es el mismo, sumarme</Text>
      </Pressable>
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
  pista: {
    fontSize: 13,
    color: Paleta.inkSoft,
    marginBottom: 16,
  },
  duplicados: {
    backgroundColor: Paleta.paper,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  duplicadosTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: Paleta.ink,
    lineHeight: 20,
  },
  duplicadosPista: {
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  card: {
    gap: 8,
  },
  cardTexto: {
    gap: 2,
  },
  cardTitulo: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
  },
  cardMeta: {
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  sumarme: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: Paleta.teal,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sumarmePressed: {
    opacity: 0.88,
  },
  sumarmeTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.paperRaised,
  },
});
