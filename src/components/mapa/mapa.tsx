import { type Ref } from "react";
import MapViewNativo, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  type MapViewProps,
} from "react-native-maps";

import { useTheme } from "@/hooks/use-theme";

export const ESTILO_MAPA_OSCURO = [
  { elementType: "geometry", stylers: [{ color: "#1d2c34" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e5c" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#163a34" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c6675" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
];

type Props = MapViewProps & {
  mensaje?: string;
  ref?: Ref<MapViewNativo>;
};

export function MapView({
  mensaje: _mensaje,
  ref,
  customMapStyle,
  ...props
}: Props) {
  const tema = useTheme();

  return (
    <MapViewNativo
      ref={ref}
      provider={PROVIDER_GOOGLE}
      customMapStyle={
        customMapStyle ?? (tema.esOscuro ? ESTILO_MAPA_OSCURO : [])
      }
      {...props}
    />
  );
}

export { Marker, Callout };
export default MapView;