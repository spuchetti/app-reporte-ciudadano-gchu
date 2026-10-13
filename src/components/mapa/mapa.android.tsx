import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

const CENTRO = { latitude: -33.0094, longitude: -58.5145 };
const COLOR_PIN = "#D64545";

type Coordenada = { latitude: number; longitude: number };

type Region = Coordenada & {
  latitudeDelta?: number;
  longitudeDelta?: number;
};

type EventoArrastre = {
  nativeEvent: { coordinate: Coordenada };
};

type MarkerProps = {
  coordinate: Coordenada;
  pinColor?: string;
  title?: string;
  description?: string;
  draggable?: boolean;
  onDragEnd?: (evento: EventoArrastre) => void;
  children?: ReactNode;
};

type MapViewProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  pointerEvents?: "none" | "auto" | "box-none" | "box-only";
  mensaje?: string;
  accessibilityLabel?: string;
};

type Marcador = {
  id: number;
  latitude: number;
  longitude: number;
  color: string;
  titulo: string;
  detalle: string;
  foto: string | null;
  draggable: boolean;
};

function zoomDesdeDelta(latitudeDelta: number | undefined) {
  const delta = latitudeDelta && latitudeDelta > 0 ? latitudeDelta : 0.04;
  const zoom = Math.log2(360 / delta);
  return Math.max(3, Math.min(18, Math.round(zoom)));
}

function colorPin(color: string | undefined) {
  return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : COLOR_PIN;
}

function recorrer(nodo: ReactNode, textos: string[], fotos: string[]) {
  if (nodo == null || typeof nodo === "boolean") {
    return;
  }
  if (typeof nodo === "string" || typeof nodo === "number") {
    const texto = String(nodo).trim();
    if (texto) {
      textos.push(texto);
    }
    return;
  }
  if (Array.isArray(nodo)) {
    nodo.forEach((item) => recorrer(item, textos, fotos));
    return;
  }
  if (!isValidElement(nodo)) {
    return;
  }
  const props = nodo.props as {
    children?: ReactNode;
    source?: { uri?: string } | number;
  };
  if (props.source && typeof props.source === "object" && props.source.uri) {
    fotos.push(props.source.uri);
  }
  recorrer(props.children, textos, fotos);
}

function contenidoMarcador(marker: MarkerProps) {
  const textos: string[] = [];
  const fotos: string[] = [];
  recorrer(marker.children, textos, fotos);
  return {
    titulo: textos[0] ?? marker.title ?? "",
    detalle: textos.slice(1).join("\n") || marker.description || "",
    foto: fotos[0] ?? null,
  };
}

function marcadoresDe(children: ReactNode) {
  const marcadores: Marcador[] = [];
  const alSoltar = new Map<number, MarkerProps["onDragEnd"]>();

  Children.forEach(children, (hijo) => {
    if (!isValidElement(hijo)) {
      return;
    }
    const props = hijo.props as MarkerProps;
    if (!props.coordinate) {
      return;
    }
    const id = marcadores.length;
    const contenido = contenidoMarcador(props);
    marcadores.push({
      id,
      latitude: props.coordinate.latitude,
      longitude: props.coordinate.longitude,
      color: colorPin(props.pinColor),
      titulo: contenido.titulo,
      detalle: contenido.detalle,
      foto: contenido.foto,
      draggable: Boolean(props.draggable),
    });
    if (props.onDragEnd) {
      alSoltar.set(id, props.onDragEnd);
    }
  });

  return { marcadores, alSoltar };
}

const HTML_MAPA = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; margin: 0; background: #E1F5EE; }
    .marcador { background: transparent; border: none; }
    .punto {
      box-sizing: border-box;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(18, 35, 46, 0.45);
    }
    .globo { font-family: sans-serif; color: #12232E; max-width: 200px; }
    .globo img { width: 100%; height: 96px; object-fit: cover; border-radius: 6px; display: block; margin-bottom: 6px; }
    .globo strong { display: block; font-size: 14px; margin-bottom: 4px; }
    .globo p { margin: 0; font-size: 13px; line-height: 18px; color: #3E5560; }
    #aviso {
      display: none;
      box-sizing: border-box;
      height: 100%;
      padding: 24px;
      text-align: center;
      font-family: sans-serif;
      color: #3E5560;
    }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <div id="aviso">No se pudo cargar el mapa. Revisá tu conexión.</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = null;
    var grupo = null;
    var usuario = null;
    var vistaLista = false;
    var siguiendo = false;

    function escapar(texto) {
      return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/\\n/g, "<br>");
    }

    function globo(marcador) {
      if (!marcador.titulo && !marcador.detalle && !marcador.foto) return "";
      var foto = marcador.foto
        ? '<img alt="" src="' + escapar(marcador.foto) + '">'
        : "";
      var titulo = marcador.titulo ? "<strong>" + escapar(marcador.titulo) + "</strong>" : "";
      var detalle = marcador.detalle ? "<p>" + escapar(marcador.detalle) + "</p>" : "";
      return '<div class="globo">' + foto + titulo + detalle + "</div>";
    }

    function seguirUsuario() {
      if (siguiendo || !navigator.geolocation) return;
      siguiendo = true;
      navigator.geolocation.watchPosition(function (posicion) {
        var punto = [posicion.coords.latitude, posicion.coords.longitude];
        if (!usuario) {
          usuario = L.circleMarker(punto, {
            radius: 8,
            color: "#ffffff",
            weight: 2,
            fillColor: "#2E6E9E",
            fillOpacity: 1,
          }).addTo(map);
        } else {
          usuario.setLatLng(punto);
        }
      }, function () {}, { enableHighAccuracy: true, maximumAge: 10000 });
    }

    function actualizarMapa(datos) {
      if (!map) return;
      map.invalidateSize();
      if (datos.controlada || !vistaLista) {
        map.setView([datos.latitude, datos.longitude], datos.zoom, { animate: false });
        vistaLista = true;
      }
      grupo.clearLayers();
      datos.marcadores.forEach(function (marcador) {
        var medida = marcador.draggable ? 22 : 16;
        var icono = L.divIcon({
          className: "marcador",
          iconSize: [medida, medida],
          iconAnchor: [medida / 2, medida / 2],
          html: '<div class="punto" style="width:' + medida + "px;height:" + medida + "px;background:" + marcador.color + '"></div>',
        });
        var pin = L.marker([marcador.latitude, marcador.longitude], {
          icon: icono,
          draggable: marcador.draggable,
        }).addTo(grupo);
        var html = globo(marcador);
        if (html) pin.bindPopup(html);
        if (marcador.draggable) {
          pin.on("dragend", function () {
            var ll = pin.getLatLng();
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "dragend",
                id: marcador.id,
                latitude: ll.lat,
                longitude: ll.lng,
              }));
            }
          });
        }
      });
      if (datos.showsUserLocation) seguirUsuario();
    }

    window.actualizarMapa = actualizarMapa;

    if (window.L) {
      map = L.map("mapa", { zoomControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      grupo = L.layerGroup().addTo(map);
    } else {
      document.getElementById("mapa").style.display = "none";
      document.getElementById("aviso").style.display = "flex";
      document.getElementById("aviso").style.alignItems = "center";
      document.getElementById("aviso").style.justifyContent = "center";
    }
  </script>
</body>
</html>`;

export function MapView({
  children,
  style,
  initialRegion,
  region,
  showsUserLocation = false,
  pointerEvents,
  mensaje: _mensaje,
  accessibilityLabel,
}: MapViewProps) {
  const web = useRef<WebView>(null);
  const listo = useRef(false);
  const vista: Region = region ?? initialRegion ?? CENTRO;
  const { marcadores, alSoltar } = marcadoresDe(children);
  const alSoltarPin = useRef(alSoltar);
  alSoltarPin.current = alSoltar;

  const payload = useMemo(
    () =>
      JSON.stringify({
        latitude: vista.latitude,
        longitude: vista.longitude,
        zoom: zoomDesdeDelta(vista.latitudeDelta),
        controlada: region != null,
        showsUserLocation,
        marcadores,
      }),
    [marcadores, region, showsUserLocation, vista.latitude, vista.latitudeDelta, vista.longitude],
  );

  function publicar(datos = payload) {
    web.current?.injectJavaScript(`window.actualizarMapa(${datos}); true;`);
  }

  useEffect(() => {
    if (listo.current) {
      web.current?.injectJavaScript(`window.actualizarMapa(${payload}); true;`);
    }
  }, [payload]);

  function alMensaje(evento: WebViewMessageEvent) {
    try {
      const mensaje = JSON.parse(evento.nativeEvent.data) as {
        type?: string;
        id?: number;
        latitude?: number;
        longitude?: number;
      };
      if (
        mensaje.type !== "dragend" ||
        mensaje.id == null ||
        mensaje.latitude == null ||
        mensaje.longitude == null
      ) {
        return;
      }
      alSoltarPin.current.get(mensaje.id)?.({
        nativeEvent: {
          coordinate: {
            latitude: mensaje.latitude,
            longitude: mensaje.longitude,
          },
        },
      });
    } catch {
      // Un mensaje que no es del mapa se ignora.
    }
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      pointerEvents={pointerEvents}
      style={[styles.marco, style]}
    >
      <WebView
        ref={web}
        style={StyleSheet.absoluteFill}
        source={{ html: HTML_MAPA }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        setBuiltInZoomControls={false}
        scalesPageToFit={false}
        onLoadEnd={() => {
          listo.current = true;
          publicar();
        }}
        onMessage={alMensaje}
      />
    </View>
  );
}

export function Marker(_props: MarkerProps) {
  return null;
}

export function Callout({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export default MapView;

const styles = StyleSheet.create({
  marco: {
    overflow: "hidden",
    backgroundColor: "#E1F5EE",
  },
});
