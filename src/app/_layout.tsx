import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { type PropsWithChildren } from "react";
import { Platform, useColorScheme } from "react-native";

import { EscuchaAvisos } from "@/components/avisos/escucha-avisos";
import { PantallaDesbloqueo } from "@/components/ingreso/pantalla-desbloqueo";
import { SheetPreferenciaIngreso } from "@/components/ingreso/sheet-preferencia";
import { SesionProvider, useSesion } from "@/contexto/sesion";
import { NOMBRE_BASE_DATOS, migrarBaseDeDatos } from "@/servicios/base-datos";
import { hidratarBorradorDesdeSQLite } from "@/servicios/borrador";

SplashScreen.preventAutoHideAsync();

async function inicializarSQLite(db: SQLiteDatabase) {
  await migrarBaseDeDatos(db);
  await hidratarBorradorDesdeSQLite();
}

function ProveedorBaseDatos({ children }: PropsWithChildren) {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }

  return (
    <SQLiteProvider
      databaseName={NOMBRE_BASE_DATOS}
      onInit={inicializarSQLite}
    >
      {children}
    </SQLiteProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ProveedorBaseDatos>
        <SesionProvider>
          <SplashScreenController />
          <RootNavigator />
          <SheetPreferenciaIngreso />
        </SesionProvider>
      </ProveedorBaseDatos>
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

  if (pendienteDesbloqueo && rolToken) {
    return <PantallaDesbloqueo rol={rolToken} />;
  }

  const esVecino =
    sesion?.esInvitado === false && sesion.usuario.rol === "vecino";
  const esOperador =
    sesion?.esInvitado === false && sesion.usuario.rol === "operador";
  const enPublico = !esVecino && !esOperador;

  return (
    <>
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
    </>
  );
}