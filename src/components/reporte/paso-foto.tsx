import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

import { CapturaCamara } from "@/components/foto/captura-camara";
import { Fonts, Paleta } from "@/constants/theme";

type Props = {
  fotos: string[];
  onFotos: (fotos: string[]) => void;
  onRevisando?: (revisando: boolean) => void;
};

type Destino = "agregar" | "retomar";

export function PasoFoto({ fotos, onFotos, onRevisando }: Props) {
  const [capturando, setCapturando] = useState(fotos.length === 0);
  const [destino, setDestino] = useState<Destino>("agregar");

  const mostrarCamara = capturando || fotos.length === 0;

  useEffect(() => {
    onRevisando?.(!mostrarCamara);
  }, [mostrarCamara, onRevisando]);

  function incorporar(uri: string) {
    if (destino === "retomar") {
      onFotos([uri, ...fotos.slice(1)].slice(0, 2));
    } else {
      onFotos([...fotos, uri].slice(0, 2));
    }
    setCapturando(false);
  }

  if (mostrarCamara) {
    return (
      <CapturaCamara
        pista="Que se vea el problema completo"
        onFoto={incorporar}
        onCerrar={fotos.length > 0 ? () => setCapturando(false) : undefined}
      />
    );
  }

  return (
    <View>
      <View style={styles.marco}>
        <Image
          source={{ uri: fotos[0] }}
          style={styles.hero}
          contentFit="cover"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retomar"
          onPress={() => {
            setDestino("retomar");
            setCapturando(true);
          }}
          style={styles.retomar}
        >
          <Ionicons name="refresh-outline" size={16} color={Paleta.ink} />
          <Text style={styles.retomarTexto}>Retomar</Text>
        </Pressable>
      </View>
      <View style={styles.extra}>
        <Image
          source={{ uri: fotos[0] }}
          style={styles.miniatura}
          contentFit="cover"
        />
        {fotos[1] ? (
          <View style={styles.segunda}>
            <Image
              source={{ uri: fotos[1] }}
              style={styles.segundaImagen}
              contentFit="cover"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar segunda foto"
              hitSlop={6}
              onPress={() => onFotos(fotos.slice(0, 1))}
              style={styles.quitar}
            >
              <Ionicons name="close" size={14} color={Paleta.ink} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar otra foto"
            onPress={() => {
              setDestino("agregar");
              setCapturando(true);
            }}
            style={styles.agregar}
          >
            <Ionicons name="add" size={18} color={Paleta.tealDeep} />
            <Text style={styles.agregarTexto}>Agregar otra foto</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.opcional}>La segunda foto es opcional.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#3F4A57",
    marginBottom: 14,
  },
  hero: {
    width: "100%",
    height: 248,
  },
  retomar: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retomarTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Paleta.ink,
  },
  extra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniatura: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#3F4A57",
  },
  agregar: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Paleta.teal,
    backgroundColor: Paleta.tealSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  agregarTexto: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Paleta.tealDeep,
  },
  segunda: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#3F4A57",
  },
  segundaImagen: {
    width: "100%",
    height: "100%",
  },
  quitar: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Paleta.paperRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  opcional: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
    marginTop: 8,
  },
});
