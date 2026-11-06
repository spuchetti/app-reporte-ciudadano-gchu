import "@/servicios/estabilidad-runtime";

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { EscuchaAvisos } from "@/components/avisos/escucha-avisos";
import { EscuchaRed } from "@/components/avisos/escucha-red";
import { PantallaDesbloqueo } from "@/components/ingreso/pantalla-desbloqueo";
import { SheetPreferenciaIngreso } from "@/components/ingreso/sheet-preferencia";
import { SesionProvider, useSesion } from "@/contexto/sesion";
import { TemaProvider, useTema } from "@/contexto/tema";

SplashScreen.preventAutoHideAsync();

/**
 * Layout web: sin expo-sqlite (wa-sqlite.wasm rompe el bundle).
 * Tema y navegación iguales al nativo.
 */
export default function RootLayoutWeb() {
  const [fuentesCargadas, errorFuente] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (errorFuente) {
    throw errorFuente;
  }
  if (!fuentesCargadas) {
    return null;
  }

  return (
    <TemaProvider>
      <ProveedorNavegacionTema>
        <SesionProvider>
          <SplashScreenController />
          <RootNavigator />
          <SheetPreferenciaIngreso />
        </SesionProvider>
      </ProveedorNavegacionTema>
    </TemaProvider>
  );
}

function ProveedorNavegacionTema({ children }: PropsWithChildren) {
  const { esOscuro } = useTema();

  return (
    <ThemeProvider value={esOscuro ? DarkTheme : DefaultTheme}>
      <StatusBar style={esOscuro ? "light" : "dark"} />
      {children}
    </ThemeProvider>
  );
}

function SplashScreenController() {
  const { isLoading } = useSesion();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}

function RootNavigator() {
  const { sesion, isLoading, pendienteDesbloqueo, rolToken } = useSesion();

  if (isLoading) {
    return null;
  }

  const esVecino =
    sesion?.esInvitado === false && sesion.usuario.rol === "vecino";
  const esOperador =
    sesion?.esInvitado === false && sesion.usuario.rol === "operador";
  const enPublico = !esVecino && !esOperador;

  return (
    <View style={styles.contenedorRaiz}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={enPublico}>
          <Stack.Screen name="(publico)" />
        </Stack.Protected>
        <Stack.Protected guard={esVecino}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={esOperador}>
          <Stack.Screen name="(operador)" />
        </Stack.Protected>
        <Stack.Screen name="reporte" />
        <Stack.Screen name="reclamo/[id]" />
      </Stack>

      <EscuchaAvisos />
      <EscuchaRed />

      {pendienteDesbloqueo && rolToken ? (
        <View style={StyleSheet.absoluteFill}>
          <PantallaDesbloqueo rol={rolToken} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorRaiz: {
    flex: 1,
  },
});
