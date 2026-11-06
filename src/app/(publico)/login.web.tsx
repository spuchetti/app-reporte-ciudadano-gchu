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
import { LogoMarca } from "@/components/ui/logo-marca";
import { useDesbloqueoAlEntrar } from "@/components/ingreso/use-desbloqueo";
import { Fonts, Paleta, PaletaOperador } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { esErrorServicio } from "@/servicios/error";

/** Login operador solo web — no modifica `login.tsx` (móvil). */
export default function LoginOperadorWebScreen() {
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

  return (
    <View style={[styles.pantalla, { minHeight: height }]}>
      <StatusBar style="light" />
      <View style={[styles.fila, !ancho && styles.filaApilada]}>
        <View style={[styles.marca, ancho ? styles.marcaLado : styles.marcaArriba]}>
          <LogoMarca size={ancho ? 120 : 88} sobreOscuro />
          <Text style={styles.tituloMarca}>Reporte Ciudadano</Text>
          <Text style={styles.subtituloMarca}>
            Acceso para operadores municipales
          </Text>
        </View>

        <View style={styles.formulario}>
          <View style={styles.formInner}>
            <Text style={styles.tituloForm}>Operador</Text>
            <Text style={styles.subtituloForm}>
              Ingresá con tu cuenta municipal
            </Text>

            <Text style={styles.etiqueta}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@gualeguaychu.gov.ar"
              placeholderTextColor={Paleta.inkSoft}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              editable={!ocupado}
              onFocus={() => setFocoEmail(true)}
              onBlur={() => setFocoEmail(false)}
              style={[
                styles.input,
                focoEmail ? styles.inputFoco : null,
                // @ts-expect-error outlineStyle es de react-native-web
                { outlineStyle: "none" },
              ]}
            />

            <View style={styles.filaEtiqueta}>
              <Text style={styles.etiqueta}>Contraseña</Text>
              <Pressable
                onPress={() => setMostrarClave((v) => !v)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.mostrar}>
                  {mostrarClave ? "Ocultar" : "Mostrar"}
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="••••••••"
              placeholderTextColor={Paleta.inkSoft}
              secureTextEntry={!mostrarClave}
              autoComplete="password"
              editable={!ocupado}
              onSubmitEditing={() => void onIngresar()}
              onFocus={() => setFocoClave(true)}
              onBlur={() => setFocoClave(false)}
              style={[
                styles.input,
                focoClave ? styles.inputFoco : null,
                // @ts-expect-error outlineStyle es de react-native-web
                { outlineStyle: "none" },
              ]}
            />

            {error || desbloqueo.error ? (
              <Text style={styles.error}>{error ?? desbloqueo.error}</Text>
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

            <View style={styles.ayuda}>
              <Text style={styles.ayudaTitulo}>Cuenta de prueba</Text>
              <Text style={styles.ayudaTexto}>
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
    backgroundColor: Paleta.paperRaised,
  },
  fila: {
    flex: 1,
    flexDirection: "row",
  },
  filaApilada: {
    flexDirection: "column",
  },
  marca: {
    backgroundColor: PaletaOperador.oscura,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
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
    color: Paleta.paperRaised,
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
    backgroundColor: Paleta.paperRaised,
  },
  formInner: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  tituloForm: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Paleta.ink,
    marginBottom: 6,
  },
  subtituloForm: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Paleta.inkSoft,
    marginBottom: 28,
  },
  etiqueta: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.ink,
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
    color: PaletaOperador.principal,
  },
  input: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Paleta.ink,
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: Paleta.paperRaised,
  },
  inputFoco: {
    borderColor: PaletaOperador.principal,
    borderWidth: 2,
  },
  error: {
    fontFamily: Fonts.medium,
    color: Paleta.rojo,
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
    backgroundColor: "#F3F6F8",
    borderRadius: 16,
  },
  ayudaTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Paleta.ink,
    marginBottom: 6,
  },
  ayudaTexto: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
    lineHeight: 18,
  },
});
