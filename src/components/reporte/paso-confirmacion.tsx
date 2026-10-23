import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { MapView, Marker } from "@/components/mapa";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { Fonts, Paleta } from "@/constants/theme";
import { nombreZona } from "@/servicios/bandeja";
import { zonaParaCoordenadas } from "@/servicios/ubicacion";
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
  const zona = nombreZona(
    zonaParaCoordenadas({ latitud, longitud }),
  );

  return (
    <View style={styles.caja}>
      {fotos[0] ? (
        <Image source={{ uri: fotos[0] }} style={styles.foto} contentFit="cover" />
      ) : null}
      <View style={styles.tipoFila}>
        {tipo ? <IconoCategoria tipoId={tipo.id} size={24} /> : null}
        <Text style={styles.tipo}>
          {tipo?.nombre ?? "Tipo de problema"}
        </Text>
      </View>
      {tipo ? <Text style={styles.area}>{tipo.areaResponsable}</Text> : null}
      <View style={styles.mapa}>
        <MapView
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          mensaje={direccion}
          region={{
            latitude: latitud,
            longitude: longitud,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          }}
        >
          <Marker coordinate={{ latitude: latitud, longitude: longitud }} />
        </MapView>
      </View>
      <Text style={styles.direccion}>{direccion}</Text>
      <Text style={styles.zona}>{zona}</Text>
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
  tipoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  foto: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: Paleta.paper,
  },
  tipo: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    fontWeight: "600",
    color: Paleta.ink,
  },
  area: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
    marginTop: -6,
  },
  mapa: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Paleta.tealSoft,
  },
  direccion: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.ink,
  },
  zona: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.tealDeep,
  },
  descripcion: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
  },
  audio: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.tealDeep,
  },
});
