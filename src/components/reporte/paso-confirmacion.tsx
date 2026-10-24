import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { MapView, Marker } from "@/components/mapa";
import { NotaDeVoz } from "@/components/reporte/nota-de-voz";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { obtenerCategoriaVisual } from "@/constants/categorias";
import { Fonts, Paleta, fondoSuave } from "@/constants/theme";
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
  audioUrl,
}: Props) {
  const zona = nombreZona(zonaParaCoordenadas({ latitud, longitud }));
  const categoria = tipo ? obtenerCategoriaVisual(tipo.id) : undefined;

  return (
    <View style={styles.caja}>
      {fotos[0] ? (
        <Image source={{ uri: fotos[0] }} style={styles.foto} contentFit="cover" />
      ) : (
        <View style={styles.fotoVacia}>
          <Ionicons name="camera-outline" size={36} color="#9BB0BC" />
        </View>
      )}

      <View style={styles.tipoFila}>
        <View
          style={[
            styles.icono,
            { backgroundColor: fondoSuave(categoria?.color ?? Paleta.teal) },
          ]}
        >
          {tipo ? <IconoCategoria tipoId={tipo.id} size={22} /> : null}
        </View>
        <View style={styles.tipoTexto}>
          <Text style={styles.tipo}>{tipo?.nombre ?? "Tipo de problema"}</Text>
          {tipo ? <Text style={styles.area}>{tipo.areaResponsable}</Text> : null}
        </View>
      </View>

      <View style={styles.mapa}>
        <MapView
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          mensaje={direccion}
          region={{
            latitude: latitud,
            longitude: longitud,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          }}
        >
          <Marker
            coordinate={{ latitude: latitud, longitude: longitud }}
            pinColor={Paleta.teal}
          />
        </MapView>
      </View>

      <View style={styles.lugar}>
        <Ionicons name="location-outline" size={18} color={Paleta.tealDeep} />
        <Text style={styles.direccion} numberOfLines={1}>
          {direccion}
        </Text>
        <View style={styles.zona}>
          <Text style={styles.zonaTexto}>{zona}</Text>
        </View>
      </View>

      {audioUrl ? <NotaDeVoz uri={audioUrl} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    gap: 14,
  },
  foto: {
    width: "100%",
    height: 168,
    borderRadius: 20,
    backgroundColor: "#E7F1F4",
  },
  fotoVacia: {
    width: "100%",
    height: 168,
    borderRadius: 20,
    backgroundColor: "#E7F1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  tipoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tipoTexto: {
    flex: 1,
    gap: 2,
  },
  tipo: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Paleta.ink,
  },
  area: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  mapa: {
    height: 132,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Paleta.tealSoft,
  },
  lugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  direccion: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Paleta.ink,
  },
  zona: {
    paddingHorizontal: 2,
  },
  zonaTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.tealDeep,
  },
});
