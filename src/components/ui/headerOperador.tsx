import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function HeaderOperador({ children, style }: Props) {
  const insets = useSafeAreaInsets();
  const tema = useTheme();

  return (
    <View
      style={[
        styles.cabecera,
        {
          backgroundColor: tema.operadorDeep,
          borderBottomColor: tema.outline,
          borderBottomWidth: tema.esOscuro ? 1 : 0,
          paddingTop: Platform.OS === "web" ? 48 : insets.top + 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
});