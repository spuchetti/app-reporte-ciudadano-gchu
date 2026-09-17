import { useEffect, useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo-texto";
import { Paleta } from "@/constants/theme";
import { esErrorServicio } from "@/servicios/error";
import { obtenerTiposReporte, validarBorradorReporte } from "@/servicios/reportes";
import { TipoDeReporte } from "@/tipos";

export default function GenerarReporteScreen() {
  const insets = useSafeAreaInsets();
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [tipoId, setTipoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargandoTipos, setCargandoTipos] = useState(true);

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const lista = await obtenerTiposReporte();
        if (activo) {
          setTipos(lista);
        }
      } catch {
        if (activo) {
          setError("No se pudieron cargar los tipos de reporte.");
        }
      } finally {
        if (activo) {
          setCargandoTipos(false);
        }
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  function onContinuar() {
    setError(null);
    try {
      validarBorradorReporte({ tipoId, descripcion, direccion });
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "Revisá los datos del reporte.",
      );
      return;
    }

    router.push({
      pathname: "/register",
      params: {
        tipoId,
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 24,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.formInner}>
          <Text style={styles.titulo}>Generar reporte</Text>
          <Text style={styles.subtitulo}>
            Contanos el problema. Tus datos los pedimos en el siguiente paso.
          </Text>

          <Text style={styles.etiqueta}>Tipo de problema</Text>
          {cargandoTipos ? (
            <Text style={styles.cargando}>Cargando tipos…</Text>
          ) : (
            <View style={styles.tipos}>
              {tipos.map((tipo) => {
                const seleccionado = tipo.id === tipoId;
                return (
                  <Pressable
                    key={tipo.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seleccionado }}
                    onPress={() => setTipoId(tipo.id)}
                    style={[
                      styles.tipo,
                      seleccionado ? styles.tipoActivo : null,
                    ]}
                  >
                    <Text style={styles.tipoIcono}>{tipo.icono}</Text>
                    <Text
                      style={[
                        styles.tipoNombre,
                        seleccionado ? styles.tipoNombreActivo : null,
                      ]}
                    >
                      {tipo.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <CampoTexto
            etiqueta="Dirección"
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ej. Rocamora 1240"
            autoComplete="street-address"
            textContentType="fullStreetAddress"
          />
          <CampoTexto
            etiqueta="Descripción (opcional)"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="¿Qué está pasando?"
            multiline
            style={styles.descripcion}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Boton
            titulo="Continuar"
            disabled={cargandoTipos}
            onPress={onContinuar}
          />
          <View style={styles.separador} />
          <Boton
            titulo="Volver al mapa"
            variante="texto"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paperRaised,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  formInner: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 28,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: Paleta.inkSoft,
    marginBottom: 24,
    lineHeight: 20,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 8,
  },
  tipos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  cargando: {
    fontSize: 13,
    color: Paleta.inkSoft,
    marginBottom: 20,
  },
  tipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Paleta.line,
    backgroundColor: Paleta.paper,
  },
  tipoActivo: {
    borderColor: Paleta.teal,
    backgroundColor: "#E1F5EE",
  },
  tipoIcono: {
    fontSize: 14,
  },
  tipoNombre: {
    fontSize: 13,
    color: Paleta.ink,
  },
  tipoNombreActivo: {
    fontWeight: "600",
    color: Paleta.tealDeep,
  },
  descripcion: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  error: {
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 12,
  },
  separador: {
    height: 8,
  },
});
