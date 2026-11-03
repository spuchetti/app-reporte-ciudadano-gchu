import { useEffect } from "react";
import { Redirect, Stack, useSegments } from "expo-router";

import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function PublicoLayout() {
  const segmentos = useSegments();
  const tema = useTheme();
  const { irAlLoginOperador, consumirLoginOperador } = useSesion();
  const enLogin = segmentos[segmentos.length - 1] === "login";

  useEffect(() => {
    if (irAlLoginOperador && enLogin) {
      consumirLoginOperador();
    }
  }, [consumirLoginOperador, enLogin, irAlLoginOperador]);

  return (
    <>
      {irAlLoginOperador && !enLogin ? <Redirect href="/(publico)/login" /> : null}
      <Stack
        initialRouteName={irAlLoginOperador ? "login" : "index"}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: tema.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}