import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

import { CapturaCamara } from "@/components/foto/captura-camara";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  fotos: string[];
  onFotos: (fotos: string[]) => void;
  onRevisando?: (revisando: boolean) => void;
};

type Destino = "agregar" | "retomar";

export function PasoFoto({ fotos, onFotos, onRevisando }: Props) {
  const tema = useTheme();
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
      <View style={[styles.marco, { backgroundColor: tema.surfaceVariant }]}>
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
          style={[
            styles.retomar,
            {
              backgroundColor: tema.surface,
              borderColor: tema.outline,
              borderWidth: 1,
            },
          ]}
        >
          <Ionicons name="refresh-outline" size={16} color={tema.onSurface} />
          <Text style={[styles.retomarTexto, { color: tema.onSurface }]}>Retomar</Text>
        </Pressable>
      </View>
      <View style={styles.extra}>
        <Image
          source={{ uri: fotos[0] }}
          style={[styles.miniatura, { backgroundColor: tema.surfaceVariant }]}
          contentFit="cover"
        />
        {fotos[1] ? (
          <View style={[styles.segunda, { backgroundColor: tema.surfaceVariant }]}>
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
              style={[
                styles.quitar,
                {
                  backgroundColor: tema.surface,
                  borderColor: tema.outline,
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons name="close" size={14} color={tema.onSurface} />
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
            style={[
              styles.agregar,
              {
                borderColor: tema.primary,
                backgroundColor: tema.primaryContainer,
              },
            ]}
          >
            <Ionicons name="add" size={18} color={tema.onPrimaryContainer} />
            <Text style={[styles.agregarTexto, { color: tema.onPrimaryContainer }]}>
              Agregar otra foto
            </Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.opcional, { color: tema.onSurfaceVariant }]}>
        La segunda foto es opcional.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    borderRadius: 22,
    overflow: "hidden",
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
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retomarTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
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
  },
  agregar: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  agregarTexto: {
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  segunda: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    overflow: "hidden",
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
    alignItems: "center",
    justifyContent: "center",
  },
  opcional: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginTop: 8,
  },
});