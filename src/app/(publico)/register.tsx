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
import { BotonTema } from "@/components/ui/boton-tema";
import { CampoTexto } from "@/components/ui/campo-texto";
import { useDesbloqueoAlEntrar } from "@/components/ingreso/use-desbloqueo";
import { Fonts } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
import { borradorListoParaEnviar, leerBorrador } from "@/servicios/borrador";
import { esErrorServicio } from "@/servicios/error";

export default function DatosVecinoScreen() {
  const insets = useSafeAreaInsets();
  const tema = useTheme();
  const { enviarPrimerReporte, adherirPrimerReporte, identificar } = useSesion();
  const adhesionId = leerBorrador().adherirAId;
  const borrador = borradorListoParaEnviar();
  const esReingreso = !adhesionId && !borrador;
  const esAdhesion = Boolean(adhesionId);
  const esPrimerReporte = !esReingreso && !esAdhesion;
  const desbloqueo = useDesbloqueoAlEntrar("vecino", esReingreso);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function mensajeError(err: unknown) {
    if (esErrorServicio(err)) {
      if (err.codigo === "SIN_CONEXION" || err.codigo === "RED") {
        if (esAdhesion) {
          return "Necesitás conexión a internet para sumarte a un reporte.";
        }
        if (esPrimerReporte) {
          return "Sin conexión el reporte se guarda en el teléfono y se envía solo cuando vuelva internet.";
        }
        return "Necesitás conexión a internet para ingresar.";
      }
      return err.mensaje;
    }
    if (err instanceof Error) {
      return err.message;
    }
    if (esReingreso) {
      return "No se pudo identificar. Intentá de nuevo.";
    }
    if (esAdhesion) {
      return "No se pudo sumarte al reporte. Intentá de nuevo.";
    }
    return "No se pudo enviar el reporte. Intentá de nuevo.";
  }

  async function onSubmit() {
    setError(null);
    setCargando(true);
    try {
      const datos = { nombre, email, telefono, contrasena };
      if (adhesionId) {
        await adherirPrimerReporte(datos, adhesionId);
        return;
      }
      if (esReingreso || !borrador) {
        await identificar(datos);
        return;
      }

      await enviarPrimerReporte(datos, borrador);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.pantalla, { backgroundColor: tema.surface }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style={tema.esOscuro ? "light" : "dark"} />
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
          <View style={styles.cabeceraFila}>
            <Text style={[styles.titulo, { color: tema.onSurface }]}>Tus datos</Text>
            <BotonTema />
          </View>

          <Text style={[styles.subtitulo, { color: tema.onSurfaceVariant }]}>
            {esReingreso
              ? "Usá el mismo email y contraseña. Si es la primera vez, te creamos la cuenta."
              : esAdhesion
                ? "Los pedimos para sumarte al reporte y avisarte el estado."
                : "Los pedimos para enviar el reporte y avisarte el estado. Sin internet se guarda en el teléfono y se envía después."}
          </Text>

          <CampoTexto
            etiqueta="Nombre"
            icono="person-outline"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            autoComplete="name"
            textContentType="name"
            editable={!cargando}
          />
          <CampoTexto
            etiqueta="Email"
            icono="mail-outline"
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
            icono="call-outline"
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
            icono="lock-closed-outline"
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            editable={!cargando}
          />

          {error || desbloqueo.error ? (
            <Text style={[styles.error, { color: tema.error }]}>{error ?? desbloqueo.error}</Text>
          ) : null}

          <Boton
            titulo={
              esReingreso
                ? "Ingresar"
                : esAdhesion
                  ? "Sumarme al reporte"
                  : "Enviar reporte"
            }
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
  pantalla: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  formInner: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    padding: 4,
  },
  cabeceraFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 30,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    marginBottom: 32,
    lineHeight: 20,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 12,
  },
  separador: {
    height: 8,
  },
});