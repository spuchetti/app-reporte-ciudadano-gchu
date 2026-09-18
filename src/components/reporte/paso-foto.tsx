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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";

type Props = {
  fotos: string[];
  onFotos: (fotos: string[]) => void;
};

export function PasoFoto({ fotos, onFotos }: Props) {
  const { height } = useWindowDimensions();
  const altoCamara = Math.min(560, Math.round(height * 0.62));
  const camaraRef = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [capturando, setCapturando] = useState(fotos.length === 0);
  const [camaraLista, setCamaraLista] = useState(false);
  const [tomando, setTomando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [esperandoPermiso, setEsperandoPermiso] = useState(false);
  const pidioPermiso = useRef(false);

  const mostrarCamara = capturando || fotos.length === 0;

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
      const siguientes = [...fotos, foto.uri].slice(0, 2);
      onFotos(siguientes);
      setCapturando(false);
    } catch {
      setError("No se pudo usar la cámara. Probá elegir de la galería.");
    } finally {
      setTomando(false);
    }
  }

  async function elegirDeGaleria() {
    setError(null);
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
    const siguientes = [...fotos, resultado.assets[0].uri].slice(0, 2);
    onFotos(siguientes);
    setCapturando(false);
  }

  if (!permiso || esperandoPermiso) {
    return (
      <Text style={styles.ayuda}>
        Para sacar la foto, el teléfono va a pedirte permiso de cámara.
      </Text>
    );
  }

  if (mostrarCamara && !permiso.granted) {
    return (
      <View style={styles.permiso}>
        <Text style={styles.ayuda}>
          La foto es obligatoria. Si bloqueaste la cámara, activala en Ajustes o
          elegí una imagen de la galería.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Boton
          titulo="Elegir de galería"
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
      </View>
    );
  }

  if (mostrarCamara) {
    return (
      <View style={[styles.camaraCaja, { height: altoCamara }]}>
        {Platform.OS === "web" ? (
          <View style={styles.camaraWeb}>
            <Text style={styles.ayudaClaro}>
              En el celular la cámara ocupa toda la pantalla. Acá podés elegir una foto.
            </Text>
          </View>
        ) : (
          <CameraView
            ref={camaraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setCamaraLista(true)}
          />
        )}
        <View style={styles.camaraPie}>
          {error ? <Text style={styles.errorClaro}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
            disabled={tomando || (Platform.OS !== "web" && !camaraLista)}
            onPress={() => void tomarFoto()}
            style={styles.obturador}
          />
          <Boton
            titulo="Elegir de galería"
            variante="secundario"
            onPress={() => void elegirDeGaleria()}
          />
          {fotos.length > 0 ? (
            <>
              <View style={styles.separador} />
              <Boton
                titulo="Volver a la vista previa"
                variante="texto"
                onPress={() => setCapturando(false)}
              />
            </>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.previews}>
        {fotos.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            style={styles.preview}
            contentFit="cover"
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Boton
        titulo="Retomar"
        variante="secundario"
        onPress={() => {
          onFotos([]);
          setCapturando(true);
        }}
      />
      {fotos.length === 1 ? (
        <>
          <View style={styles.separador} />
          <Boton
            titulo="Agregar segunda foto"
            variante="texto"
            onPress={() => setCapturando(true)}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ayuda: {
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
    marginBottom: 16,
  },
  ayudaClaro: {
    fontSize: 14,
    color: Paleta.paperRaised,
    lineHeight: 20,
    textAlign: "center",
  },
  permiso: {
    gap: 4,
  },
  error: {
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 12,
  },
  errorClaro: {
    color: Paleta.paperRaised,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  camaraCaja: {
    height: 420,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Paleta.ink,
    justifyContent: "flex-end",
  },
  camaraWeb: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: Paleta.tealDeep,
  },
  camaraPie: {
    padding: 16,
    backgroundColor: "rgba(18,35,46,0.55)",
    alignItems: "center",
  },
  obturador: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Paleta.paperRaised,
    borderWidth: 4,
    borderColor: Paleta.orange,
    marginBottom: 12,
  },
  previews: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  preview: {
    flex: 1,
    height: 180,
    borderRadius: 12,
    backgroundColor: Paleta.paper,
  },
  separador: {
    height: 10,
  },
});
