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
  const logoSize = Math.min(96, Math.max(64, width * 0.2));
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
      <IconoPrincipal
        width={logoSize}
        height={logoSize}
        style={styles.logo}
        accessibilityLabel="Reporte Ciudadano"
      />
      <Text style={styles.tituloMarca}>Reporte Ciudadano</Text>
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
            { paddingTop: dosColumnas ? 48 : 32 },
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
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  marcaLado: {
    flex: 1,
    minHeight: "100%",
  },
  marcaColumna: {
    flex: 1,
  },
  logo: {
    marginBottom: 24,
    flexShrink: 0,
  },
  tituloMarca: {
    fontFamily: Fonts.semiBold,
    fontSize: 32,
    color: Paleta.paperRaised,
    textAlign: "center",
    marginBottom: 12,
  },
  subtituloMarca: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
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
    fontFamily: Fonts.semiBold,
    fontSize: 28,
    color: Paleta.ink,
    marginBottom: 8,
  },
  subtituloForm: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    marginBottom: 32,
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
    marginTop: 24,
    padding: 12,
    backgroundColor: Paleta.paper,
    borderRadius: 8,
  },
  ayudaTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Paleta.ink,
    marginBottom: 6,
  },
  ayudaTexto: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Paleta.inkSoft,
    lineHeight: 16,
  },
});
