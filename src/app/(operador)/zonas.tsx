import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import TarjetaZona from "@/components/operador/tarjeta-zona";
import Cargando from "@/components/ui/cargando";
import HeaderOperador from "@/components/ui/headerOperador";
import { fondoSuave, Fonts, Paleta, PaletaOperador } from "@/constants/theme";
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
      <HeaderOperador style={styles.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bandeja"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.volver}
        >
          <Ionicons name="arrow-back" size={22} color={Paleta.paperRaised} />
        </Pressable>
        <View style={styles.informacion}>
          <Text style={styles.titulo}>Zonas y cuadrillas</Text>
          {usuario ? <Text style={styles.subtitulo}>{usuario.nombre}</Text> : null}
        </View>
      </HeaderOperador>

      {cargando ? (
        <Cargando text={cargando} style={{ backgroundColor: PaletaOperador.oscura }} />
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
    color: Paleta.paperRaised,
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
    color: Paleta.rojo,
    textAlign: "center",
    backgroundColor: fondoSuave(Paleta.rojo),
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
