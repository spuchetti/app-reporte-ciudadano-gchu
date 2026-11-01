import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Boton } from "@/components/ui/boton";
import { Fonts, Paleta } from "@/constants/theme";

type Props = {
  pista: string;
  onFoto: (uri: string) => void;
  onCerrar?: () => void;
  altura?: number;
};

/** Visor de cámara compartido: saca la foto adentro de la app, sin abrir la cámara del sistema. */
export function CapturaCamara({ pista, onFoto, onCerrar, altura }: Props) {
  const { height } = useWindowDimensions();
  const altoCamara = altura ?? Math.min(560, Math.round(height * 0.62));
  const camaraRef = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [camaraLista, setCamaraLista] = useState(false);
  const [tomando, setTomando] = useState(false);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [error, setError] = useState<string | null>(null);
  const [esperandoPermiso, setEsperandoPermiso] = useState(false);
  const pidioPermiso = useRef(false);

  useEffect(() => {
    if (!permiso || permiso.granted || !permiso.canAskAgain || pidioPermiso.current) {
      return;
    }
    pidioPermiso.current = true;
    setEsperandoPermiso(true);
    void pedirPermiso().finally(() => setEsperandoPermiso(false));
  }, [permiso, pedirPermiso]);

  async function tomarFoto() {
    if (!camaraLista || tomando) {
      return;
    }
    setTomando(true);
    setError(null);
    try {
      const foto = await camaraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!foto?.uri) {
        setError("No se pudo tomar la foto. Probá de nuevo.");
        return;
      }
      onFoto(foto.uri);
    } catch {
      setError("No se pudo usar la cámara. Probá elegir de la galería.");
    } finally {
      setTomando(false);
    }
  }

  async function elegirDeGaleria() {
    setError(null);
    try {
      const permisoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permisoGaleria.granted) {
        setError("Necesitamos acceso a la galería para elegir una foto.");
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsMultipleSelection: false,
      });
      if (resultado.canceled || !resultado.assets[0]?.uri) {
        return;
      }
      onFoto(resultado.assets[0].uri);
    } catch {
      setError("No se pudo abrir la galería. Probá de nuevo.");
    }
  }

  if (!permiso || esperandoPermiso) {
    return (
      <Text style={styles.ayuda}>
        Para sacar la foto, el teléfono va a pedirte permiso de cámara.
      </Text>
    );
  }

  if (!permiso.granted) {
    return (
      <View style={styles.permiso}>
        <Text style={styles.ayuda}>
          La foto es obligatoria. Si bloqueaste la cámara, activala en Ajustes o
          elegí una imagen de la galería.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Boton
          titulo="Elegir de galería"
          icono="image-outline"
          onPress={() => void elegirDeGaleria()}
        />
        {permiso.canAskAgain ? (
          <>
            <View style={styles.separador} />
            <Boton
              titulo="Usar la cámara"
              variante="secundario"
              onPress={() => void pedirPermiso()}
            />
          </>
        ) : (
          <>
            <View style={styles.separador} />
            <Boton
              titulo="Abrir Ajustes"
              variante="texto"
              onPress={() => {
                void Linking.openSettings();
              }}
            />
          </>
        )}
        {onCerrar ? (
          <>
            <View style={styles.separador} />
            <Boton titulo="Volver" variante="texto" onPress={onCerrar} />
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.captura}>
      <View style={[styles.visor, { height: altoCamara }]}>
        {Platform.OS === "web" ? (
          <View style={styles.camaraWeb}>
            <Text style={styles.ayudaClaro}>
              En el celular la cámara ocupa el visor. Acá podés elegir una foto.
            </Text>
          </View>
        ) : (
          <CameraView
            ref={camaraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            flash={flash}
            onCameraReady={() => setCamaraLista(true)}
          />
        )}
        <View style={[styles.esquina, styles.esquinaSuperiorIzquierda]} />
        <View style={[styles.esquina, styles.esquinaSuperiorDerecha]} />
        <View style={[styles.esquina, styles.esquinaInferiorIzquierda]} />
        <View style={[styles.esquina, styles.esquinaInferiorDerecha]} />
        <View style={styles.pista}>
          <Text style={styles.pistaTexto}>{pista}</Text>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.controles}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Galería"
          onPress={() => void elegirDeGaleria()}
          style={styles.control}
        >
          <Ionicons name="image-outline" size={26} color={Paleta.ink} />
          <Text style={styles.controlTexto}>Galería</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tomar foto"
          disabled={tomando || (Platform.OS !== "web" && !camaraLista)}
          onPress={() => void tomarFoto()}
          style={styles.obturador}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={flash === "on" ? "Apagar flash" : "Prender flash"}
          onPress={() => setFlash((actual) => (actual === "on" ? "off" : "on"))}
          style={styles.control}
        >
          <Ionicons
            name={flash === "on" ? "flash-outline" : "flash-off-outline"}
            size={26}
            color={flash === "on" ? Paleta.tealDeep : Paleta.ink}
          />
          <Text style={styles.controlTexto}>Flash</Text>
        </Pressable>
      </View>
      {onCerrar ? (
        <Boton titulo="Volver" variante="texto" onPress={onCerrar} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ayuda: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
    marginBottom: 16,
  },
  ayudaClaro: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.paperRaised,
    lineHeight: 20,
    textAlign: "center",
  },
  permiso: {
    gap: 4,
  },
  error: {
    fontFamily: Fonts.medium,
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 12,
  },
  captura: {
    gap: 8,
  },
  visor: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#172033",
  },
  camaraWeb: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#172033",
  },
  esquina: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: Paleta.paperRaised,
  },
  esquinaSuperiorIzquierda: {
    top: 18,
    left: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  esquinaSuperiorDerecha: {
    top: 18,
    right: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  esquinaInferiorIzquierda: {
    bottom: 64,
    left: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  esquinaInferiorDerecha: {
    bottom: 64,
    right: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  pista: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  pistaTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.paperRaised,
  },
  controles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  control: {
    width: 72,
    alignItems: "center",
    gap: 4,
  },
  controlTexto: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Paleta.ink,
  },
  obturador: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Paleta.teal,
    borderWidth: 4,
    borderColor: Paleta.tealSoft,
  },
  separador: {
    height: 10,
  },
});
