import MapViewNativo, {
  Callout,
  Marker,
  type MapViewProps,
} from "react-native-maps";

type Props = MapViewProps & {
  mensaje?: string;
};

export function MapView({ mensaje: _mensaje, ...props }: Props) {
  return <MapViewNativo {...props} />;
}

export { Marker, Callout };
export default MapView;
