import MapViewNativo, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  type MapViewProps,
} from "react-native-maps";

type Props = MapViewProps & {
  mensaje?: string;
};

export function MapView({ mensaje: _mensaje, ...props }: Props) {
  return <MapViewNativo {...props} provider={PROVIDER_GOOGLE} />;
}

export { Marker, Callout };
export default MapView;
