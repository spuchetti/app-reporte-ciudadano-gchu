import { type Ref } from "react";
import MapViewNativo, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  type MapViewProps,
} from "react-native-maps";

import { ESTILO_MAPA_OSCURO } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
