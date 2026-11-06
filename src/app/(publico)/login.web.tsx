import { useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { Boton } from "@/components/ui/boton";
import { BotonTema } from "@/components/ui/boton-tema";
import { LogoMarca } from "@/components/ui/logo-marca";
import { useDesbloqueoAlEntrar } from "@/components/ingreso/use-desbloqueo";
import { Fonts } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
import { esErrorServicio } from "@/servicios/error";

/** Login operador solo web — no modifica `login.tsx` (móvil). */
export default function LoginOperadorWebScreen() {
  const tema = useTheme();
  const { width, height } = useWindowDimensions();
  const ancho = width >= 960;
  const { iniciarSesion } = useSesion();
  const desbloqueo = useDesbloqueoAlEntrar("operador", true);

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [focoEmail, setFocoEmail] = useState(false);
  const [focoClave, setFocoClave] = useState(false);

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

  const ocupado = cargando || desbloqueo.desbloqueando;
  const panelMarca = tema.esOscuro ? tema.operadorDeep : tema.operadorDeep;

  return (
    <View
      style={[
        styles.pantalla,
        { minHeight: height, backgroundColor: tema.surface },
      ]}
    >
      <StatusBar style="light" />
      <View style={[styles.fila, !ancho && styles.filaApilada]}>
        <View
          style={[
            styles.marca,
            { backgroundColor: panelMarca },
            ancho ? styles.marcaLado : styles.marcaArriba,
          ]}
        >
          <View style={styles.marcaTop}>
            <BotonTema sobreFondoOscuro />
          </View>
          <LogoMarca size={ancho ? 120 : 88} sobreOscuro />
          <Text style={styles.tituloMarca}>Reporte Ciudadano</Text>
          <Text style={styles.subtituloMarca}>
            Acceso para operadores municipales
          </Text>
        </View>

        <View
          style={[styles.formulario, { backgroundColor: tema.surface }]}
        >
          <View style={styles.formInner}>
            <Text style={[styles.tituloForm, { color: tema.onSurface }]}>
              Operador
            </Text>
            <Text
              style={[styles.subtituloForm, { color: tema.onSurfaceVariant }]}
            >
              Ingresá con tu cuenta municipal
            </Text>

            <Text style={[styles.etiqueta, { color: tema.onSurface }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@gualeguaychu.gov.ar"
              placeholderTextColor={tema.onSurfaceVariant}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              editable={!ocupado}
              onFocus={() => setFocoEmail(true)}
              onBlur={() => setFocoEmail(false)}
              style={[
                styles.input,
                {
                  color: tema.onSurface,
                  borderColor: focoEmail ? tema.operador : tema.outline,
                  backgroundColor: tema.surface,
                  borderWidth: focoEmail ? 2 : 1,
                },
                // @ts-expect-error outlineStyle es de react-native-web
                { outlineStyle: "none" },
              ]}
            />

            <View style={styles.filaEtiqueta}>
              <Text style={[styles.etiqueta, { color: tema.onSurface }]}>
                Contraseña
              </Text>
              <Pressable
                onPress={() => setMostrarClave((v) => !v)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={[styles.mostrar, { color: tema.operador }]}>
                  {mostrarClave ? "Ocultar" : "Mostrar"}
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="••••••••"
              placeholderTextColor={tema.onSurfaceVariant}
              secureTextEntry={!mostrarClave}
              autoComplete="password"
              editable={!ocupado}
              onSubmitEditing={() => void onIngresar()}
              onFocus={() => setFocoClave(true)}
              onBlur={() => setFocoClave(false)}
              style={[
                styles.input,
                {
                  color: tema.onSurface,
                  borderColor: focoClave ? tema.operador : tema.outline,
                  backgroundColor: tema.surface,
                  borderWidth: focoClave ? 2 : 1,
                },
                // @ts-expect-error outlineStyle es de react-native-web
                { outlineStyle: "none" },
              ]}
            />

            {error || desbloqueo.error ? (
              <Text style={[styles.error, { color: tema.error }]}>
                {error ?? desbloqueo.error}
              </Text>
            ) : null}

            <View style={styles.espacioBoton} />
            <Boton
              titulo="Ingresar"
              rol="operador"
              cargando={ocupado}
              disabled={ocupado}
              onPress={() => void onIngresar()}
            />

            <View style={styles.separador} />
            <Boton
              titulo="Volver al mapa"
              variante="texto"
              rol="operador"
              disabled={ocupado}
              onPress={() => router.replace("/")}
            />

            <View
              style={[
                styles.ayuda,
                { backgroundColor: tema.surfaceVariant },
              ]}
            >
              <Text style={[styles.ayudaTitulo, { color: tema.onSurface }]}>
                Cuenta de prueba
              </Text>
              <Text
                style={[styles.ayudaTexto, { color: tema.onSurfaceVariant }]}
              >
                Norte: operador.norte@demo.ar / demo1234{"\n"}
                Sur: operador.sur@demo.ar / demo1234
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  fila: {
    flex: 1,
    flexDirection: "row",
  },
  filaApilada: {
    flexDirection: "column",
  },
  marca: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  marcaTop: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  marcaLado: {
    flex: 1,
    maxWidth: 480,
  },
  marcaArriba: {
    paddingVertical: 40,
  },
  tituloMarca: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtituloMarca: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    maxWidth: 280,
  },
  formulario: {
    flex: 1.2,
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  formInner: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  tituloForm: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    marginBottom: 6,
  },
  subtituloForm: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    marginBottom: 28,
  },
  etiqueta: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    marginBottom: 8,
  },
  filaEtiqueta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mostrar: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  input: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 12,
  },
  espacioBoton: {
    height: 8,
  },
  separador: {
    height: 14,
  },
  ayuda: {
    marginTop: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  ayudaTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    marginBottom: 6,
  },
  ayudaTexto: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
});
