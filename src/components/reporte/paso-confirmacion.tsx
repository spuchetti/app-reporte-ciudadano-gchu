import { Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import MapView, { Marker } from "react-native-maps";

import { Paleta } from "@/constants/theme";
import { TipoDeReporte } from "@/tipos";

type Props = {
  tipo: TipoDeReporte | undefined;
  fotos: string[];
  direccion: string;
  latitud: number;
  longitud: number;
  descripcion: string;
  audioUrl: string | null;
};

export function PasoConfirmacion({
  tipo,
  fotos,
  direccion,
  latitud,
  longitud,
  descripcion,
  audioUrl,
}: Props) {
  return (
    <View style={styles.caja}>
      {fotos[0] ? (
        <Image source={{ uri: fotos[0] }} style={styles.foto} contentFit="cover" />
      ) : null}
      <Text style={styles.tipo}>
        {tipo ? `${tipo.icono}  ${tipo.nombre}` : "Tipo de problema"}
      </Text>
      {tipo ? <Text style={styles.area}>{tipo.areaResponsable}</Text> : null}
      <View style={styles.mapa}>
        {Platform.OS === "web" ? (
          <Text style={styles.mapaWeb}>{direccion}</Text>
        ) : (
          <MapView
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            region={{
              latitude: latitud,
              longitude: longitud,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            }}
          >
            <Marker
              coordinate={{ latitude: latitud, longitude: longitud }}
            />
          </MapView>
        )}
      </View>
      <Text style={styles.direccion}>{direccion}</Text>
      {descripcion.trim() ? (
        <Text style={styles.descripcion}>{descripcion.trim()}</Text>
      ) : null}
      {audioUrl ? (
        <Text style={styles.audio}>Nota de voz adjunta</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    gap: 10,
  },
  foto: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: Paleta.paper,
  },
  tipo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 20,
    fontWeight: "600",
    color: Paleta.ink,
  },
  area: {
    fontSize: 13,
    color: Paleta.inkSoft,
    marginTop: -6,
  },
  mapa: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E1F5EE",
  },
  mapaWeb: {
    flex: 1,
    padding: 16,
    textAlign: "center",
    color: Paleta.inkSoft,
  },
  direccion: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.ink,
  },
  descripcion: {
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
  },
  audio: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.tealDeep,
  },
});
