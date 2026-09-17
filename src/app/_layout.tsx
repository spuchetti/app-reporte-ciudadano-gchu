import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import { SesionProvider, useSesion } from "@/contexto/sesion";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SesionProvider>
        <SplashScreenController />
        <RootNavigator />
      </SesionProvider>
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
  const { sesion, isLoading } = useSesion();

  if (isLoading) {
    return null;
  }

  const esVecino =
    sesion?.esInvitado === false && sesion.usuario.rol === "vecino";
  const esOperador =
    sesion?.esInvitado === false && sesion.usuario.rol === "operador";
  const enPublico = !esVecino && !esOperador;

  return (
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
    </Stack>
  );
}
