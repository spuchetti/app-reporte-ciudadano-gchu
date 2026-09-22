import { Paleta } from "@/constants/theme";
import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    children: React.ReactNode
    style?: StyleProp<ViewStyle>
}
export default function HeaderOperador({ children, style }: Props) {
    const insets = useSafeAreaInsets()
    return <View
        style={[
            styles.cabecera,
            { paddingTop: Platform.OS === "web" ? 48 : insets.top + 16 },
            style,
        ]}
    >
        {children}
    </View>
}

const styles = StyleSheet.create({
    cabecera: {
        backgroundColor: Paleta.orange,
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
})
