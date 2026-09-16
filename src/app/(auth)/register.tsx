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
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { esErrorServicio } from "@/servicios/error";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { registrar } = useSesion();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit() {
    if (contrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError(null);
    setCargando(true);
    try {
      await registrar({
        nombre,
        email,
        telefono: telefono.trim() ? telefono.trim() : null,
        contrasena,
      });
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo crear la cuenta. Intentá de nuevo.",
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
          <Text style={styles.titulo}>Crear cuenta</Text>
          <Text style={styles.subtitulo}>Registro de vecinos de Gualeguaychú</Text>

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
            etiqueta="Teléfono (opcional)"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="3446-123456"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            editable={!cargando}
          />
          <CampoTexto
            etiqueta="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!cargando}
          />
          <CampoTexto
            etiqueta="Confirmar contraseña"
            value={confirmacion}
            onChangeText={setConfirmacion}
            placeholder="Repetí la contraseña"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!cargando}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Boton titulo="Crear cuenta" cargando={cargando} onPress={onSubmit} />
          <View style={styles.separador} />
          <Boton
            titulo="Ya tengo cuenta"
            variante="texto"
            disabled={cargando}
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
