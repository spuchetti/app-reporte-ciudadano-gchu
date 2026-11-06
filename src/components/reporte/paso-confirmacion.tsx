import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { MapView, Marker } from "@/components/mapa";
import { NotaDeVoz } from "@/components/reporte/nota-de-voz";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { obtenerCategoriaVisual } from "@/constants/categorias";
import { Fonts, fondoSuave } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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
  const tema = useTheme();
  const zona = nombreZona(zonaParaCoordenadas({ latitud, longitud }));
  const categoria = tipo ? obtenerCategoriaVisual(tipo.id) : undefined;

  return (
    <View style={styles.caja}>
      {fotos[0] ? (
        <Image
          source={{ uri: fotos[0] }}
          style={[styles.foto, { backgroundColor: tema.surfaceVariant }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.fotoVacia, { backgroundColor: tema.surfaceVariant }]}>
          <Ionicons name="camera-outline" size={36} color={tema.onSurfaceVariant} />
        </View>
      )}

      <View style={styles.tipoFila}>
        <View
          style={[
            styles.icono,
            { backgroundColor: fondoSuave(categoria?.color ?? tema.primary) },
          ]}
        >
          {tipo ? <IconoCategoria tipoId={tipo.id} size={22} /> : null}
        </View>
        <View style={styles.tipoTexto}>
          <Text style={[styles.tipo, { color: tema.onSurface }]}>
            {tipo?.nombre ?? "Tipo de problema"}
          </Text>
          {tipo ? (
            <Text style={[styles.area, { color: tema.onSurfaceVariant }]}>
              {tipo.areaResponsable}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.mapa,
          {
            backgroundColor: tema.surfaceVariant,
            borderColor: tema.outline,
            borderWidth: tema.esOscuro ? 1 : 0,
          },
        ]}
      >
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
            pinColor={tema.primary}
          />
        </MapView>
      </View>

      <View style={styles.lugar}>
        <Ionicons name="location-outline" size={18} color={tema.primary} />
        <Text style={[styles.direccion, { color: tema.onSurface }]} numberOfLines={1}>
          {direccion}
        </Text>
        <View style={styles.zona}>
          <Text style={[styles.zonaTexto, { color: tema.primary }]}>{zona}</Text>
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
  },
  fotoVacia: {
    width: "100%",
    height: 168,
    borderRadius: 20,
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
  },
  area: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  mapa: {
    height: 132,
    borderRadius: 18,
    overflow: "hidden",
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
  },
  zona: {
    paddingHorizontal: 2,
  },
  zonaTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
});