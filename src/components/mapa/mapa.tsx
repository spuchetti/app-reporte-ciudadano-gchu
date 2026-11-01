import { type Ref } from "react";
import MapViewNativo, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  type MapViewProps,
} from "react-native-maps";

type Props = MapViewProps & {
  mensaje?: string;
  ref?: Ref<MapViewNativo>;
};

export function MapView({ mensaje: _mensaje, ref, ...props }: Props) {
  return <MapViewNativo ref={ref} {...props} provider={PROVIDER_GOOGLE} />;
}

export { Marker, Callout };
export default MapView;
