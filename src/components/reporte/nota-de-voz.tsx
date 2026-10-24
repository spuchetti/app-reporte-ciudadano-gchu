import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";

import { Fonts, Paleta } from "@/constants/theme";

const BARRAS = [8, 14, 20, 12, 18, 26, 16, 22, 10, 18, 24, 14, 20, 12, 16, 22, 8, 18, 14, 24, 12, 20];

type Props = {
  uri: string;
  onBorrar?: () => void;
};

export function NotaDeVoz({ uri, onBorrar }: Props) {
  const player = useAudioPlayer({ uri }, { updateInterval: 80 });
  const estado = useAudioPlayerStatus(player);

  useEffect(() => {
    player.volume = 1;
  }, [player]);

  async function reproducir() {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: "doNotMix",
    });
    player.volume = 1;
    if (estado.playing) {
      player.pause();
      return;
    }
    const termino =
      estado.duration > 0 && estado.currentTime >= estado.duration - 0.05;
    if (termino) {
      await player.seekTo(0);
    }
    player.play();
  }

  const segundos = estado.duration > 0 ? estado.duration : 0;
  const avance =
    estado.duration > 0 ? Math.min(1, estado.currentTime / estado.duration) : 0;
  const posicion = avance * BARRAS.length;

  return (
    <View style={styles.nota}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={estado.playing ? "Pausar nota de voz" : "Reproducir nota de voz"}
        onPress={() => {
          void reproducir();
        }}
        style={styles.play}
      >
        <Ionicons
          name={estado.playing ? "pause" : "play"}
          size={16}
          color={Paleta.paperRaised}
        />
      </Pressable>
      <View style={styles.notaTexto}>
        <Text style={styles.notaTitulo}>Nota de voz</Text>
        <Text style={styles.notaTiempo}>{formatoSegundos(segundos)}</Text>
      </View>
      <View style={styles.onda}>
        {BARRAS.map((alto, indice) => {
          const lleno = Math.max(0, Math.min(1, posicion - indice));
          return (
            <View key={indice} style={[styles.barra, { height: alto }]}>
              <View style={[styles.barraPintada, { width: `${lleno * 100}%` }]} />
            </View>
          );
        })}
      </View>
      {onBorrar ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar nota de voz"
          onPress={onBorrar}
          hitSlop={8}
          style={styles.borrar}
        >
          <Ionicons name="close" size={20} color={Paleta.inkSoft} />
        </Pressable>
      ) : null}
    </View>
  );
}

function formatoSegundos(segundos: number) {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  nota: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E6ECF0",
    borderRadius: 16,
    backgroundColor: Paleta.paperRaised,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Paleta.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  notaTexto: {
    gap: 1,
  },
  notaTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Paleta.ink,
  },
  notaTiempo: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  onda: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    height: 28,
  },
  barra: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#D5EEF2",
    overflow: "hidden",
  },
  barraPintada: {
    height: "100%",
    backgroundColor: Paleta.teal,
  },
  borrar: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
