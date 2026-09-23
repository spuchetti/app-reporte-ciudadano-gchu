import { Paleta } from "@/constants/theme";
import { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";


export default function Cargando({ text, style }: { text: string, style?: StyleProp<ViewStyle> }) {

    const rebote = useSharedValue(0)
    const estiloRebote = useAnimatedStyle(() => ({
        transform: [{ translateY: rebote.value }],
    }))

    useEffect(() => {
        rebote.value = withRepeat(
            withSequence(
                withTiming(-14, { duration: 300, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 600, easing: Easing.bounce }),
            ),
            -1,
        )
    }, [rebote])

    return (
        <View style={styles.cargandoContenedor}>
            <Animated.Text style={[styles.cargando, estiloRebote, style]}>
                {text}
            </Animated.Text>
        </View>
    )
}


const styles = StyleSheet.create({
    cargandoContenedor: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cargando: {
        padding: 30,
        borderRadius: 8,
        textAlign: "center",
        backgroundColor: Paleta.tealDeep,
        paddingVertical: 32,
        fontSize: 14,
        color: Paleta.paper,
    },
})