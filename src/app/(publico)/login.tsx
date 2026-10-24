import { useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo-texto";
import { useDesbloqueoAlEntrar } from "@/components/ingreso/use-desbloqueo";
import IconoPrincipal from "@/assets/branding/icono_principal.svg";
import { Fonts, Paleta, PaletaOperador } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { esErrorServicio } from "@/servicios/error";

export default function LoginOperadorScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logoSize = Math.min(76, Math.max(64, width * 0.18));
  const dosColumnas = width >= 768;
  const { iniciarSesion } = useSesion();
  const desbloqueo = useDesbloqueoAlEntrar("operador", true);

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onIngresar() {
    if (!email.trim() || !contrasena) {
      setError("Completá email y contraseña.");
      return;
    }

    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(email, contrasena);
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo completar el acceso. Intentá de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  const marca = (
    <View style={[styles.marca, dosColumnas ? styles.marcaLado : null]}>
      <View style={styles.circuloGrande} />
      <View style={styles.circuloChico} />
      <IconoPrincipal
        width={logoSize}
        height={logoSize}
        style={styles.logo}
        accessibilityLabel="Reporte Ciudadano"
      />
      <Text style={styles.tituloMarca}>{"Reporte\nCiudadano"}</Text>
      <Text style={styles.subtituloMarca}>
        Acceso para operadores municipales.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 24) },
          dosColumnas ? styles.scrollFila : null,
        ]}
      >
        <View
          style={[
            dosColumnas
              ? styles.marcaColumna
              : { paddingTop: insets.top, backgroundColor: PaletaOperador.oscura },
          ]}
        >
          {marca}
        </View>

        <View
          style={[
            styles.formulario,
            { paddingTop: dosColumnas ? 48 : 28 },
          ]}
        >
          <View style={styles.formInner}>
            <Text style={styles.tituloForm}>Operador</Text>
            <Text style={styles.subtituloForm}>
              Ingresá con tu cuenta municipal
            </Text>

            <CampoTexto
              rol="operador"
              etiqueta="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@gualeguaychu.gov.ar"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!cargando}
            />

            <CampoTexto
              rol="operador"
              etiqueta="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              editable={!cargando}
              onSubmitEditing={onIngresar}
            />

            {error || desbloqueo.error ? (
              <Text style={styles.error}>{error ?? desbloqueo.error}</Text>
            ) : null}

            <Boton
              titulo="Ingresar"
              rol="operador"
              cargando={cargando || desbloqueo.desbloqueando}
              disabled={cargando || desbloqueo.desbloqueando}
              onPress={onIngresar}
            />

            <View style={styles.separador} />
            <Boton
              titulo="Volver al mapa"
              variante="texto"
              rol="operador"
              disabled={cargando || desbloqueo.desbloqueando}
              onPress={() => router.replace("/")}
            />

            <View style={styles.ayuda}>
              <Text style={styles.ayudaTitulo}>Cuenta de prueba</Text>
              <Text style={styles.ayudaTexto}>
                Operador: jorge.fernandez@gualeguaychu.gov.ar / operador123
              </Text>
            </View>
          </View>
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
  },
  scrollFila: {
    flexDirection: "row",
    minHeight: "100%",
  },
  marca: {
    backgroundColor: PaletaOperador.oscura,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circuloGrande: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -80,
    right: -70,
  },
  circuloChico: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -70,
    left: -60,
  },
  marcaLado: {
    flex: 1,
    minHeight: "100%",
  },
  marcaColumna: {
    flex: 1,
  },
  logo: {
    marginBottom: 12,
    flexShrink: 0,
  },
  tituloMarca: {
    fontFamily: Fonts.bold,
    fontSize: 30,
    lineHeight: 34,
    color: Paleta.paperRaised,
    textAlign: "center",
    marginBottom: 8,
  },
  subtituloMarca: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  formulario: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: Paleta.paperRaised,
  },
  formInner: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  tituloForm: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: Paleta.ink,
    marginBottom: 4,
  },
  subtituloForm: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    marginBottom: 22,
  },
  error: {
    fontFamily: Fonts.medium,
    color: Paleta.rojo,
    fontSize: 13,
    marginBottom: 12,
  },
  separador: {
    height: 12,
  },
  ayuda: {
    marginTop: 28,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F3F6F8",
    borderRadius: 16,
  },
  ayudaTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Paleta.ink,
    marginBottom: 4,
  },
  ayudaTexto: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
    lineHeight: 18,
  },
});
