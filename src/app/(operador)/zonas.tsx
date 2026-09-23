import { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import TarjetaZona from "@/components/operador/tarjeta-zona";
import Cargando from "@/components/ui/cargando";
import HeaderOperador from "@/components/ui/headerOperador";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { ZonaConCuadrillas, zonasConCuadrillas } from "@/servicios/zonas";

export default function Zonas() {
  const router = useRouter();
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
    <View style={styles.pantalla}>
      <HeaderOperador>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bandeja"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Text style={styles.volver}>← Bandeja</Text>
        </Pressable>
        <View style={styles.informacion}>
          <Text style={styles.titulo}>Zonas y cuadrillas</Text>
          {usuario ? <Text style={styles.subtitulo}>{usuario.nombre}</Text> : null}
        </View>
      </HeaderOperador>

      {cargando ? (
        <Cargando text={cargando} style={{ backgroundColor: Paleta.orange }} />
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

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paper,
  },
  volver: {
    fontSize: 16,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  informacion: {
    alignItems: "center",
    gap: 4,
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 28,
    fontWeight: "600",
    color: Paleta.paperRaised,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  lista: {
    flex: 1,
  },
  listaContenido: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  error: {
    marginHorizontal: 16,
    marginBottom: 16,
    fontSize: 15,
    fontWeight: "700",
    borderRadius: 8,
    color: Paleta.rojo,
    textAlign: "center",
    backgroundColor: `${Paleta.rojo}22`,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
