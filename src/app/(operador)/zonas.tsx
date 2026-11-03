import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import TarjetaZona from "@/components/operador/tarjeta-zona";
import { BotonTema } from "@/components/ui/boton-tema";
import Cargando from "@/components/ui/cargando";
import HeaderOperador from "@/components/ui/headerOperador";
import { Fonts } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
import { ZonaConCuadrillas, zonasConCuadrillas } from "@/servicios/zonas";

export default function Zonas() {
  const router = useRouter();
  const tema = useTheme();
  const { sesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  const [zonas, setZonas] = useState<ZonaConCuadrillas[]>([]);
  const [cargando, setCargando] = useState("Cargando zonas");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    (async () => {
      setCargando("Cargando zonas");
      setError("");
      try {
        const grupos = await zonasConCuadrillas();
        if (activo) {
          setZonas(grupos);
        }
      } catch {
        if (activo) {
          setError("No se pudieron cargar las zonas.");
        }
      } finally {
        if (activo) {
          setCargando("");
        }
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  return (
    <View style={[styles.pantalla, { backgroundColor: tema.background }]}>
      <StatusBar style="light" />
      <HeaderOperador style={styles.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bandeja"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.volver}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.informacion}>
          <Text style={styles.titulo}>Zonas y cuadrillas</Text>
          {usuario ? <Text style={styles.subtitulo}>{usuario.nombre}</Text> : null}
        </View>
        <BotonTema sobreFondoOscuro />
      </HeaderOperador>

      {cargando ? (
        <Cargando text={cargando} style={{ backgroundColor: "transparent" }} />
      ) : (
        <FlatList
          style={styles.lista}
          contentContainerStyle={styles.listaContenido}
          data={zonas}
          keyExtractor={(item) => item.zona.id}
          renderItem={({ item }) => (
            <TarjetaZona
              zona={item.zona}
              cuadrillas={item.cuadrillas}
              zonaOperadorId={usuario?.zonaId ?? null}
            />
          )}
        />
      )}

      {error ? (
        <Text
          style={[
            styles.error,
            {
              backgroundColor: tema.esOscuro
                ? "rgba(248, 113, 113, 0.16)"
                : "rgba(214, 69, 69, 0.14)",
              color: tema.error,
              borderColor: tema.outline,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volver: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  informacion: {
    flex: 1,
    minWidth: 0,
  },
  titulo: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: "#FFFFFF",
  },
  subtitulo: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
  },
  lista: {
    flex: 1,
  },
  listaContenido: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  error: {
    marginHorizontal: 20,
    marginBottom: 16,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    borderRadius: 14,
    textAlign: "center",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});