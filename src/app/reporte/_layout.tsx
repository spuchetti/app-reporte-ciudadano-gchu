import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

export default function ReporteLayout() {
  const tema = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: tema.background,
        },
      }}
    />
  );
}