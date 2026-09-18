import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { CampoTexto } from "@/components/ui/campo-texto";
import { Paleta } from "@/constants/theme";

type Props = {
  descripcion: string;
  audioUrl: string | null;
  onDescripcion: (valor: string) => void;
  onAudio: (uri: string | null) => void;
};

function formatoTiempo(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

function FichaNota({
  uri,
  duracionMs,
  onBorrar,
}: {
  uri: string;
  duracionMs: number;
  onBorrar: () => void;
}) {
  const player = useAudioPlayer({ uri });
  const etiqueta =
    duracionMs > 0 ? `Nota de voz · ${formatoTiempo(duracionMs)}` : "Nota de voz";

  return (
    <View style={styles.ficha}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reproducir nota de voz"
        onPress={() => {
          player.seekTo(0);
          player.play();
        }}
        style={styles.play}
      >
        <Text style={styles.playIcono}>▶</Text>
      </Pressable>
      <Text style={styles.fichaTexto}>{etiqueta}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Borrar nota de voz"
        onPress={onBorrar}
        hitSlop={8}
        style={styles.borrar}
      >
        <Text style={styles.borrarTexto}>×</Text>
      </Pressable>
    </View>
  );
}

export function PasoDescripcion({
  descripcion,
  audioUrl,
  onDescripcion,
  onAudio,
}: Props) {
  const grabadora = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estado = useAudioRecorderState(grabadora);
  const [error, setError] = useState<string | null>(null);
  const [duracionMs, setDuracionMs] = useState(0);

  useEffect(() => {
    if (!audioUrl) {
      setDuracionMs(0);
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      void grabadora.stop().catch(() => undefined);
    };
  }, [grabadora]);

  async function empezarGrabacion() {
    setError(null);
    const permiso = await AudioModule.requestRecordingPermissionsAsync();
    if (!permiso.granted) {
      setError("Para grabar, el teléfono tiene que permitir el micrófono.");
      return;
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });
    await grabadora.prepareToRecordAsync();
    grabadora.record();
  }

  async function detenerGrabacion() {
    const ms = estado.durationMillis;
    await grabadora.stop();
    if (grabadora.uri) {
      setDuracionMs(ms);
      onAudio(grabadora.uri);
    }
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  }

  return (
    <View>
      <CampoTexto
        etiqueta="¿Qué está pasando?"
        value={descripcion}
        onChangeText={onDescripcion}
        placeholder="Desde cuándo, si hay riesgo y cualquier dato útil para la cuadrilla."
        multiline
        style={styles.area}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {estado.isRecording ? (
        <View style={styles.filaVoz}>
          <View style={styles.punto} />
          <Text style={styles.grabando}>
            Grabando {formatoTiempo(estado.durationMillis)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Detener grabación"
            onPress={() => {
              void detenerGrabacion();
            }}
            hitSlop={8}
          >
            <Text style={styles.accion}>Detener</Text>
          </Pressable>
        </View>
      ) : audioUrl ? (
        <FichaNota
          uri={audioUrl}
          duracionMs={duracionMs}
          onBorrar={() => onAudio(null)}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar nota de voz"
          onPress={() => {
            void empezarGrabacion();
          }}
          style={styles.agregar}
        >
          <Text style={styles.agregarTexto}>Agregar nota de voz</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  error: {
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 12,
  },
  agregar: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingRight: 8,
  },
  agregarTexto: {
    fontSize: 14,
    color: Paleta.tealDeep,
    fontWeight: "500",
  },
  filaVoz: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Paleta.rojo,
  },
  grabando: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.ink,
  },
  accion: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.tealDeep,
  },
  ficha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Paleta.paper,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  play: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Paleta.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcono: {
    color: Paleta.paperRaised,
    fontSize: 12,
    marginLeft: 2,
  },
  fichaTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Paleta.ink,
  },
  borrar: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  borrarTexto: {
    fontSize: 22,
    color: Paleta.inkSoft,
    lineHeight: 24,
  },
});
