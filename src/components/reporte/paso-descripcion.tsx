import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";

import { NotaDeVoz } from "@/components/reporte/nota-de-voz";
import { Fonts, Paleta } from "@/constants/theme";

const MAX_DESCRIPCION = 300;
const FRASES = [
  "Pasa hace varios días",
  "Hay riesgo para las personas",
  "Se agrava cuando llueve",
];

function conFrase(actual: string, frase: string) {
  if (actual.includes(frase)) {
    return actual;
  }
  const base = actual.trim();
  const siguiente = base ? `${base} ${frase}` : frase;
  return siguiente.slice(0, MAX_DESCRIPCION);
}

type Props = {
  descripcion: string;
  audioUrl: string | null;
  onDescripcion: (valor: string) => void;
  onAudio: (uri: string | null) => void;
};

const MODO_GRABACION = {
  allowsRecording: true,
  playsInSilentMode: true,
  shouldRouteThroughEarpiece: false,
  interruptionMode: "doNotMix",
} as const;

const MODO_REPRODUCCION = {
  allowsRecording: false,
  playsInSilentMode: true,
  shouldRouteThroughEarpiece: false,
  interruptionMode: "doNotMix",
} as const;

function formatoTiempo(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
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
    await setAudioModeAsync(MODO_GRABACION);
    await grabadora.prepareToRecordAsync();
    grabadora.record();
  }

  async function detenerGrabacion() {
    await grabadora.stop();
    if (grabadora.uri) {
      onAudio(grabadora.uri);
    }
    await setAudioModeAsync(MODO_REPRODUCCION);
  }

  return (
    <View>
      <View style={styles.filaEtiqueta}>
        <Text style={styles.etiqueta}>¿Qué está pasando?</Text>
        <Text style={styles.opcional}>Opcional</Text>
      </View>
      <View style={styles.area}>
        <TextInput
          value={descripcion}
          onChangeText={(valor) => onDescripcion(valor.slice(0, MAX_DESCRIPCION))}
          placeholder="Contá desde cuándo pasa y si hay algún riesgo."
          placeholderTextColor={Paleta.inkSoft}
          multiline
          maxLength={MAX_DESCRIPCION}
          style={styles.input}
        />
        <Text style={styles.contador}>
          {descripcion.length}/{MAX_DESCRIPCION}
        </Text>
      </View>
      <View style={styles.frases}>
        {FRASES.map((frase) => (
          <Pressable
            key={frase}
            accessibilityRole="button"
            accessibilityLabel={`Agregar: ${frase}`}
            onPress={() => onDescripcion(conFrase(descripcion, frase))}
            style={styles.frase}
          >
            <Text style={styles.fraseMas}>+</Text>
            <Text style={styles.fraseTexto}>{frase}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {estado.isRecording ? (
        <View style={styles.voz}>
          <View style={styles.grabandoMarca}>
            <View style={styles.punto} />
          </View>
          <View style={styles.vozTexto}>
            <Text style={styles.vozTitulo}>
              Grabando {formatoTiempo(estado.durationMillis)}
            </Text>
            <Text style={styles.vozDetalle}>Tocá detener cuando termines.</Text>
          </View>
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
        <NotaDeVoz uri={audioUrl} onBorrar={() => onAudio(null)} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Grabar nota de voz"
          onPress={() => {
            void empezarGrabacion();
          }}
          style={styles.voz}
        >
          <View style={styles.microfono}>
            <Ionicons name="mic" size={18} color={Paleta.paperRaised} />
          </View>
          <View style={styles.vozTexto}>
            <Text style={styles.vozTitulo}>Grabar nota de voz</Text>
            <Text style={styles.vozDetalle}>
              Si te resulta más fácil contarlo hablando
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Paleta.inkSoft} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filaEtiqueta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  etiqueta: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.ink,
  },
  opcional: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  area: {
    minHeight: 128,
    borderRadius: 16,
    backgroundColor: "#F4F7F8",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
    marginBottom: 14,
  },
  input: {
    minHeight: 72,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Paleta.ink,
    textAlignVertical: "top",
    padding: 0,
  },
  contador: {
    position: "absolute",
    right: 12,
    bottom: 10,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  frases: {
    gap: 8,
    marginBottom: 16,
  },
  frase: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F4F7F8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  fraseMas: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Paleta.tealDeep,
  },
  fraseTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Paleta.ink,
  },
  error: {
    fontFamily: Fonts.medium,
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 12,
  },
  voz: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6ECF0",
    borderRadius: 16,
    backgroundColor: Paleta.paperRaised,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  microfono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Paleta.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  vozTexto: {
    flex: 1,
    gap: 2,
  },
  vozTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Paleta.ink,
  },
  vozDetalle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  grabandoMarca: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Paleta.rojo,
  },
  accion: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.tealDeep,
  },
});
