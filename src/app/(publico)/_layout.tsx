import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function PublicoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="reporte" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
