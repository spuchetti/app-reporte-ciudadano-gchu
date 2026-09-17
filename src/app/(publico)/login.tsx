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
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { esErrorServicio } from "@/servicios/error";

export default function LoginOperadorScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dosColumnas = width >= 768;
  const {
    iniciarSesion,
    reingresarConHuella,
    pendienteHuella,
    huellaDisponible,
    emailOperador,
    posponerAccesoOperador,
  } = useSesion();

  const [email, setEmail] = useState(emailOperador ?? "");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<"login" | "huella" | null>(null);

  const puedeHuella = pendienteHuella && huellaDisponible;
  const ocupado = cargando !== null;

  async function onIngresar() {
    if (!email.trim() || !contrasena) {
      setError("Completá email y contraseña.");
      return;
    }
    await manejar("login", () => iniciarSesion(email, contrasena));
  }

  async function manejar<T>(clave: typeof cargando, accion: () => Promise<T>) {
    setError(null);
    setCargando(clave);
    try {
      await accion();
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo completar el acceso. Intentá de nuevo.",
      );
    } finally {
      setCargando(null);
    }
  }

  const marca = (
    <View style={[styles.marca, dosColumnas ? styles.marcaLado : null]}>
      <View style={styles.logo}>
        <Text style={styles.logoEmoji}>🏛️</Text>
      </View>
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
              : { paddingTop: insets.top, backgroundColor: Paleta.tealDeep },
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
              etiqueta="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@gualeguaychu.gov.ar"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!ocupado}
            />

            <CampoTexto
              etiqueta="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              editable={!ocupado}
              onSubmitEditing={onIngresar}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Boton
              titulo="Ingresar"
              cargando={cargando === "login"}
              disabled={ocupado}
              onPress={onIngresar}
            />

            {puedeHuella ? (
              <View style={styles.bloqueHuella}>
                <Boton
                  titulo="Ingresar con huella"
                  variante="secundario"
                  cargando={cargando === "huella"}
                  disabled={ocupado}
                  onPress={() => manejar("huella", reingresarConHuella)}
                />
              </View>
            ) : null}

            <View style={styles.separador} />
            <Boton
              titulo="Volver al mapa"
              variante="texto"
              disabled={ocupado}
              onPress={() => {
                posponerAccesoOperador();
                router.replace("/");
              }}
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
    backgroundColor: Paleta.tealDeep,
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
    width: 80,
    height: 80,
    backgroundColor: Paleta.orange,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 40,
  },
  tituloMarca: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 32,
    fontWeight: "600",
    color: Paleta.paperRaised,
    textAlign: "center",
    marginBottom: 12,
  },
  subtituloMarca: {
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
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 28,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 8,
  },
  subtituloForm: {
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
    height: 12,
  },
  bloqueHuella: {
    marginTop: 12,
  },
  ayuda: {
    marginTop: 24,
    padding: 12,
    backgroundColor: Paleta.paper,
    borderRadius: 8,
  },
  ayudaTitulo: {
    fontSize: 12,
    fontWeight: "600",
    color: Paleta.ink,
    marginBottom: 6,
  },
  ayudaTexto: {
    fontSize: 11,
    color: Paleta.inkSoft,
    lineHeight: 16,
  },
});
