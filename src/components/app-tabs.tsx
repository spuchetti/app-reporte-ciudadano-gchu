import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts, Paleta } from "@/constants/theme";

const ICONOS = {
  index: { activo: "home", inactivo: "home-outline" },
  reportar: { activo: "add", inactivo: "add" },
  "mis-reportes": { activo: "reader", inactivo: "reader-outline" },
} as const;

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BarraTabs {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="reportar" options={{ title: "Reportar" }} />
      <Tabs.Screen name="mis-reportes" options={{ title: "Mis reportes" }} />
    </Tabs>
  );
}

function BarraTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const enfocado = state.index === index;
        const { options } = descriptors[route.key];
        const titulo = options.title ?? route.name;
        const iconos = ICONOS[route.name as keyof typeof ICONOS] ?? ICONOS.index;
        const esCentro = route.name === "reportar";
        const color = enfocado ? Paleta.teal : Paleta.inkSoft;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: enfocado }}
            accessibilityLabel={titulo}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!enfocado && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={styles.item}
          >
            {esCentro ? (
              <View style={styles.fab}>
                <Ionicons name="add" size={32} color={Paleta.paperRaised} />
              </View>
            ) : (
              <Ionicons
                name={enfocado ? iconos.activo : iconos.inactivo}
                size={24}
                color={color}
              />
            )}
            <Text style={[styles.etiqueta, enfocado && !esCentro ? styles.etiquetaActiva : null]}>
              {titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Paleta.paperRaised,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    paddingHorizontal: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 56,
    gap: 2,
  },
  etiqueta: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  etiquetaActiva: {
    fontFamily: Fonts.semiBold,
    color: Paleta.teal,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -26,
    backgroundColor: Paleta.teal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Paleta.tealDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
