import { useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo-texto";
import { useDesbloqueoAlEntrar } from "@/components/ingreso/use-desbloqueo";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { borradorListoParaEnviar } from "@/servicios/borrador";
import { esErrorServicio } from "@/servicios/error";

export default function DatosVecinoScreen() {
  const insets = useSafeAreaInsets();
  const { enviarPrimerReporte, identificar } = useSesion();
  const borrador = borradorListoParaEnviar();
  const esReingreso = !borrador;
  const desbloqueo = useDesbloqueoAlEntrar("vecino", esReingreso);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit() {
    setError(null);
    setCargando(true);
    try {
      const datos = { nombre, email, telefono };
      if (esReingreso || !borrador) {
        await identificar(datos);
        return;
      }

      await enviarPrimerReporte(datos, borrador);
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : esReingreso
            ? "No se pudo identificar. Intentá de nuevo."
            : "No se pudo enviar el reporte. Intentá de nuevo.",
      );
    } finally {
      setCargando(false);
    }
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
          <Text style={styles.titulo}>Tus datos</Text>
          <Text style={styles.subtitulo}>
            {esReingreso
              ? "Usá el mismo email y teléfono que cuando enviaste un reporte. No hace falta contraseña."
              : "Los pedimos para enviar el reporte y avisarte el estado. No hace falta contraseña."}
          </Text>

          <CampoTexto
            etiqueta="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            autoComplete="name"
            textContentType="name"
            editable={!cargando}
          />
          <CampoTexto
            etiqueta="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!cargando}
          />
          <CampoTexto
            etiqueta="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="3446-123456"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            editable={!cargando}
          />

          {error || desbloqueo.error ? (
            <Text style={styles.error}>{error ?? desbloqueo.error}</Text>
          ) : null}

          <Boton
            titulo={esReingreso ? "Ingresar" : "Enviar reporte"}
            cargando={cargando || desbloqueo.desbloqueando}
            disabled={cargando || desbloqueo.desbloqueando}
            onPress={onSubmit}
          />
          <View style={styles.separador} />
          <Boton
            titulo={esReingreso ? "Volver al mapa" : "Volver al reporte"}
            variante="texto"
            disabled={cargando || desbloqueo.desbloqueando}
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
    justifyContent: "center",
  },
  formInner: {
    width: "100%",
    maxWidth: 320,
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
    marginBottom: 32,
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
