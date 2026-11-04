import { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/use-theme";

export default function Cargando({
  text,
  style,
}: {
  text: string;
  style?: StyleProp<ViewStyle>;
}) {
  const tema = useTheme();
  const rebote = useSharedValue(0);

  const estiloRebote = useAnimatedStyle(() => ({
    transform: [{ translateY: rebote.value }],
  }));

  useEffect(() => {
    rebote.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 600, easing: Easing.bounce }),
      ),
      -1,
    );
  }, [rebote]);

  return (
    <View style={styles.cargandoContenedor}>
      <Animated.Text
        style={[
          styles.cargando,
          {
            backgroundColor: tema.primaryContainer,
            color: tema.onPrimaryContainer,
            borderColor: tema.outline,
            borderWidth: 1,
          },
          estiloRebote,
          style,
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cargandoContenedor: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cargando: {
    padding: 30,
    borderRadius: 14,
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 14,
    overflow: "hidden",
  },
});